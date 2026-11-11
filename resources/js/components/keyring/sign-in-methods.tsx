import type { Authenticator } from '@entity/keyring/react';
import {
    beginEnrollment,
    confirmEnrollment,
    enroll,
    KeyringRequestError,
    makeDefault,
    removeAuthenticator,
    renameAuthenticator,
    supportsWebAuthn,
} from '@entity/keyring/react';
import { router } from '@inertiajs/react';
import {
    Fingerprint,
    KeyRound,
    Mail,
    Plus,
    ShieldCheck,
    Smartphone,
} from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import RecoveryCodesDialog from '@/components/keyring/recovery-codes-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { run } from '@/keyring/actions';

/**
 * A sign-in method as Keyring's factors present it (name, hint, when it was
 * added and last used), plus whether it's the one asked for first.
 */
export type AuthenticatorRow = Authenticator & {
    id: string;
    isDefault: boolean;
};

const factorInfo: Record<
    string,
    { label: string; icon: typeof KeyRound; note?: string }
> = {
    passkey: { label: 'Passkey', icon: Fingerprint },
    'security-key': { label: 'Security key', icon: KeyRound },
    totp: { label: 'Authenticator app', icon: Smartphone },
    // Whoever reads the inbox can reset the password too, so an emailed
    // code is an extra step at sign in and never a second factor.
    'email-code': {
        label: 'Email code',
        icon: Mail,
        note: 'An extra step, not a second factor',
    },
    recovery: { label: 'Recovery codes', icon: ShieldCheck },
};

const timeAgo = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

export function ago(iso: string | null): string {
    if (!iso) {
        return 'never';
    }

    const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60000);

    if (Math.abs(minutes) < 60) {
        return timeAgo.format(minutes, 'minute');
    }

    if (Math.abs(minutes) < 60 * 24) {
        return timeAgo.format(Math.round(minutes / 60), 'hour');
    }

    return timeAgo.format(Math.round(minutes / 60 / 24), 'day');
}

type Pending = {
    factor: 'totp' | 'email-code';
    enrollment: Record<string, any>;
} | null;

export type Recovery = {
    codes: string[];
    enrollment?: Record<string, any>;
} | null;

export default function SignInMethods({
    authenticators,
    enrollable,
    hasSecondFactor,
    otherSessions,
}: {
    authenticators: AuthenticatorRow[];
    enrollable: string[];
    /** Whether there's a second factor recovery codes could back up. */
    hasSecondFactor: boolean;
    /** How many other sessions the account has, to offer signing them out. */
    otherSessions: number;
}) {
    const [pending, setPending] = useState<Pending>(null);
    const [recovery, setRecovery] = useState<Recovery>(null);
    const [busy, setBusy] = useState(false);
    const [signOutOthers, setSignOutOthers] = useState(false);
    const webauthn = supportsWebAuthn();

    // Someone else being signed in is often why a method is added or
    // removed, so the change can end the other sessions with it. Keyring
    // only does that when asked: it reads `sign_out_others` on the request
    // that confirms a new method or removes one.
    const alsoSignOut = signOutOthers && otherSessions > 0;
    const hasRecoveryCodes = authenticators.some(
        (authenticator) => authenticator.factor === 'recovery',
    );

    // Reloading remounts the page, so dialogs reload once they close.
    function showCodesOrReload(codes?: string[] | null) {
        if (codes) {
            setRecovery({ codes });
        } else {
            router.reload();
        }
    }

    async function add(factor: string) {
        setBusy(true);

        if (factor === 'passkey' || factor === 'security-key') {
            // Runs the browser ceremony; the first extra factor comes with recovery codes.
            const result = await run(
                () => enroll(factor, { sign_out_others: alsoSignOut }),
                { reload: false },
            );
            showCodesOrReload(result?.recoveryCodes);
        } else if (factor === 'recovery') {
            // New codes only replace the old ones once the user says they saved them.
            const started = await run(() => beginEnrollment('recovery'), {
                success: false,
                reload: false,
            });
            setRecovery(
                started
                    ? {
                          codes: started.enrollment.codes,
                          enrollment: started.enrollment,
                      }
                    : null,
            );
        } else if (factor === 'totp' || factor === 'email-code') {
            const started = await run(() => beginEnrollment(factor), {
                success: false,
                reload: false,
            });
            setPending(
                started ? { factor, enrollment: started.enrollment } : null,
            );
        }

        setBusy(false);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <Heading
                    variant="small"
                    title="Sign-in methods"
                    description="Everything you can use to sign in. With a passkey, security key or authenticator app set up, signing in takes two factors. An emailed code adds a step, but it isn't a second factor."
                />

                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" disabled={busy}>
                            {busy ? <Spinner /> : <Plus />}
                            Add
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {enrollable
                            .filter((factor) => factor !== 'recovery')
                            .filter(
                                (factor) =>
                                    webauthn ||
                                    (factor !== 'passkey' &&
                                        factor !== 'security-key'),
                            )
                            .map((factor) => {
                                const {
                                    label,
                                    icon: Icon,
                                    note,
                                } = factorInfo[factor] ?? {
                                    label: factor,
                                    icon: KeyRound,
                                };

                                return (
                                    <DropdownMenuItem
                                        key={factor}
                                        onSelect={() => void add(factor)}
                                    >
                                        <Icon />
                                        <span className="grid">
                                            {label}
                                            {note && (
                                                <span className="text-xs text-muted-foreground">
                                                    {note}
                                                </span>
                                            )}
                                        </span>
                                    </DropdownMenuItem>
                                );
                            })}

                        {/* Codes back up a second factor, so they're only
                            on offer once there is one. A set that exists is
                            replaced from its own row. */}
                        {enrollable.includes('recovery') &&
                            hasSecondFactor &&
                            !hasRecoveryCodes && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onSelect={() => void add('recovery')}
                                    >
                                        <ShieldCheck />
                                        Recovery codes
                                    </DropdownMenuItem>
                                </>
                            )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <ul className="divide-y rounded-lg border">
                <li className="flex items-center gap-3 p-4">
                    <KeyRound className="size-5 text-muted-foreground" />
                    <div className="flex-1">
                        <p className="text-sm font-medium">Password</p>
                        <p className="text-xs text-muted-foreground">
                            Change it below
                        </p>
                    </div>
                </li>

                {authenticators.map((authenticator) => (
                    <AuthenticatorItem
                        key={authenticator.id}
                        authenticator={authenticator}
                        signOutOthers={alsoSignOut}
                        onRegenerate={() => void add('recovery')}
                    />
                ))}
            </ul>

            {otherSessions > 0 && (
                <div className="flex items-center space-x-3">
                    <Checkbox
                        id="sign-out-others"
                        checked={signOutOthers}
                        onCheckedChange={(checked) =>
                            setSignOutOthers(checked === true)
                        }
                    />
                    <Label htmlFor="sign-out-others">
                        Sign out my other sessions when I add or remove a method
                    </Label>
                </div>
            )}

            <ConfirmCodeDialog
                pending={pending}
                signOutOthers={alsoSignOut}
                onDone={(codes) => {
                    setPending(null);
                    showCodesOrReload(codes);
                }}
            />

            <RecoveryCodesDialog
                recovery={recovery}
                signOutOthers={alsoSignOut}
                onClose={() => {
                    setRecovery(null);
                    router.reload();
                }}
            />
        </div>
    );
}

function AuthenticatorItem({
    authenticator,
    signOutOthers,
    onRegenerate,
}: {
    authenticator: AuthenticatorRow;
    signOutOthers: boolean;
    onRegenerate: () => void;
}) {
    const [renaming, setRenaming] = useState(false);
    const [name, setName] = useState(authenticator.name);
    const [askPassword, setAskPassword] = useState(false);
    const [password, setPassword] = useState('');
    const {
        label,
        icon: Icon,
        note,
    } = factorInfo[authenticator.factor] ?? {
        label: authenticator.factor,
        icon: KeyRound,
    };
    const isRecovery = authenticator.factor === 'recovery';

    // Removing the last second factor needs the password, which must then be
    // long enough on its own. Keyring answers 422 on `password` without one.
    async function remove(withPassword?: string) {
        let needsPassword = false;
        const removed = await run(
            () =>
                removeAuthenticator(authenticator.id, withPassword, {
                    signOutOthers,
                }).catch((error: unknown) => {
                    if (
                        withPassword === undefined &&
                        error instanceof KeyringRequestError &&
                        error.errors.password
                    ) {
                        needsPassword = true;

                        return null;
                    }

                    throw error;
                }),
            { reload: false },
        );

        if (needsPassword) {
            setAskPassword(true);
        } else if (removed) {
            router.reload();
        }
    }

    return (
        <li className="flex items-center gap-3 p-4">
            <Icon className="size-5 text-muted-foreground" />

            <div className="min-w-0 flex-1">
                {renaming ? (
                    <form
                        className="flex gap-2"
                        onSubmit={async (event) => {
                            event.preventDefault();
                            await run(() =>
                                renameAuthenticator(authenticator.id, name),
                            );
                            setRenaming(false);
                        }}
                    >
                        <Input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            autoFocus
                            maxLength={64}
                            className="h-8"
                        />
                        <Button size="sm" type="submit">
                            Save
                        </Button>
                    </form>
                ) : (
                    <p className="flex items-center gap-2 text-sm font-medium">
                        <span className="truncate">{authenticator.name}</span>
                        {authenticator.isDefault && (
                            <Badge variant="secondary">Default</Badge>
                        )}
                        {authenticator.replace && (
                            <Badge variant="destructive">Make a new set</Badge>
                        )}
                    </p>
                )}
                <p className="text-xs text-muted-foreground">
                    {isRecovery
                        ? `${authenticator.remaining ?? 0} ${authenticator.remaining === 1 ? 'code' : 'codes'} left${authenticator.replace ? ' · one has been used, so make a new set and save it' : ''}`
                        : [
                              label,
                              note,
                              authenticator.hint,
                              `last used ${ago(authenticator.lastUsedAt)}`,
                          ]
                              .filter(Boolean)
                              .join(' · ')}
                </p>
            </div>

            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                        Manage
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {isRecovery ? (
                        <DropdownMenuItem onSelect={onRegenerate}>
                            Make new codes
                        </DropdownMenuItem>
                    ) : (
                        <>
                            <DropdownMenuItem
                                onSelect={() => setRenaming(true)}
                            >
                                Rename
                            </DropdownMenuItem>
                            {!authenticator.isDefault && (
                                <DropdownMenuItem
                                    onSelect={() =>
                                        void run(() =>
                                            makeDefault(authenticator.id),
                                        )
                                    }
                                >
                                    Use by default
                                </DropdownMenuItem>
                            )}
                        </>
                    )}
                    <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => void remove()}
                    >
                        Remove
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={askPassword} onOpenChange={setAskPassword}>
                <DialogContent>
                    <form
                        className="space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            void remove(password);
                        }}
                    >
                        <DialogHeader>
                            <DialogTitle>
                                Remove your last second factor?
                            </DialogTitle>
                            <DialogDescription>
                                You'll sign in with just your password, so it
                                needs to be long enough on its own. Enter it to
                                go on.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-2">
                            <Label htmlFor={`password-${authenticator.id}`}>
                                Password
                            </Label>
                            <Input
                                id={`password-${authenticator.id}`}
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setAskPassword(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" variant="destructive">
                                Remove
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </li>
    );
}

/**
 * The second half of adding an authenticator app or email codes: show the QR
 * code (or say a code was sent), then confirm with a code.
 */
function ConfirmCodeDialog({
    pending,
    signOutOthers,
    onDone,
}: {
    pending: Pending;
    signOutOthers: boolean;
    onDone: (recoveryCodes: string[] | null) => void;
}) {
    const [code, setCode] = useState('');
    const [processing, setProcessing] = useState(false);
    const isTotp = pending?.factor === 'totp';

    return (
        <Dialog
            open={pending !== null}
            onOpenChange={(open) => !open && onDone(null)}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isTotp
                            ? 'Add an authenticator app'
                            : 'Add email codes'}
                    </DialogTitle>
                    <DialogDescription>
                        {isTotp
                            ? 'Scan the QR code with your authenticator app, then enter the code it shows.'
                            : 'We emailed you a code. Enter it to finish. From then on, signing in asks for a code from your email after your password. That’s an extra step, not a second factor: add an authenticator app, a passkey or a security key for one.'}
                    </DialogDescription>
                </DialogHeader>

                {isTotp && pending && (
                    <div className="grid justify-items-center gap-3">
                        <div
                            className="rounded-lg bg-white p-3"
                            // The QR code is an SVG string Keyring renders on the server.
                            dangerouslySetInnerHTML={{
                                __html: pending.enrollment.qr,
                            }}
                        />
                        <code className="rounded bg-muted px-2 py-1 text-xs break-all">
                            {pending.enrollment.secret}
                        </code>
                    </div>
                )}

                <form
                    id="confirm-code"
                    className="grid gap-2"
                    onSubmit={async (event) => {
                        event.preventDefault();

                        if (!pending) {
                            return;
                        }

                        setProcessing(true);
                        const result = await run(
                            () =>
                                confirmEnrollment(
                                    pending.factor,
                                    pending.enrollment,
                                    { code, sign_out_others: signOutOthers },
                                ),
                            { reload: false },
                        );
                        setProcessing(false);

                        if (result) {
                            setCode('');
                            onDone(result.recoveryCodes ?? null);
                        }
                    }}
                >
                    <Label htmlFor="enroll-code">Code</Label>
                    <Input
                        id="enroll-code"
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        className="font-mono tracking-widest"
                        autoFocus
                        required
                    />
                </form>

                <DialogFooter>
                    <Button
                        type="submit"
                        form="confirm-code"
                        disabled={processing}
                    >
                        {processing && <Spinner />}
                        Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
