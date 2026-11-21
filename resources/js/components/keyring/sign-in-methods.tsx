import type { Authenticator } from '@keyringjs/keyring/react';
import {
    beginEnrollment,
    confirmEnrollment,
    enroll,
    KeyringRequestError,
    makeDefault,
    removeAuthenticator,
    renameAuthenticator,
    supportsWebAuthn,
} from '@keyringjs/keyring/react';
import { router } from '@inertiajs/react';
import {
    Fingerprint,
    KeyRound,
    Mail,
    Plus,
    ShieldCheck,
    Smartphone,
} from 'lucide-react';
import { useRef, useState } from 'react';
import ChangePassword from '@/components/keyring/change-password';
import RecoveryCodesDialog from '@/components/keyring/recovery-codes-dialog';
import RowIcon from '@/components/keyring/row-icon';
import CodeInput from '@/components/code-input';
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
import {
    InsetCard,
    InsetCardDescription,
    InsetCardHeader,
    InsetCardList,
    InsetCardTitle,
} from '@/components/ui/inset-card';
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
    /** The page the user was going to before being sent to add a method. */
    continue?: string;
} | null;

export default function SignInMethods({
    authenticators,
    enrollable,
    hasSecondFactor,
    otherSessions,
    mustChangePassword,
}: {
    authenticators: AuthenticatorRow[];
    enrollable: string[];
    /** Whether there's a second factor recovery codes could back up. */
    hasSecondFactor: boolean;
    /** How many other sessions the account has, to offer signing them out. */
    otherSessions: number;
    /** Held until the password changes, so its form stays open. */
    mustChangePassword: boolean;
}) {
    const [pending, setPending] = useState<Pending>(null);
    const [changingPassword, setChangingPassword] = useState(false);
    const [recovery, setRecovery] = useState<Recovery>(null);
    const [busy, setBusy] = useState(false);
    const [signOutOthers, setSignOutOthers] = useState(false);
    const openedDialog = useRef(false);
    const webauthn = supportsWebAuthn();
    // Inertia keeps the page mounted when its props change, so the hold is
    // read on every render and not only the first.
    const showPasswordForm = mustChangePassword || changingPassword;

    // Someone else being signed in is often why a method is added or
    // removed, so the change can end the other sessions with it. Keyring
    // only does that when asked: it reads `sign_out_others` on the request
    // that confirms a new method or removes one.
    const alsoSignOut = signOutOthers && otherSessions > 0;
    const hasRecoveryCodes = authenticators.some(
        (authenticator) => authenticator.factor === 'recovery',
    );

    // Reloading remounts the page, so dialogs reload once they close. A user
    // `keyring.enrolled` sent here gets `continue` with their first method,
    // the page they were going to, and carries on there once the codes are
    // saved.
    function showCodesOrReload(codes?: string[] | null, continueTo?: string) {
        if (codes) {
            setRecovery({ codes, continue: continueTo });
        } else if (continueTo) {
            router.visit(continueTo);
        } else {
            router.reload();
        }
    }

    // While the menu fades out, the dialog a choice opens appears under the
    // pointer. Left alone, the menu would take focus back from the dialog
    // (as the pointer "leaves" the item, and again to return it to the Add
    // button), so neither happens once a dialog is on its way.
    function keepFocus(event: React.PointerEvent) {
        if (openedDialog.current) {
            event.preventDefault();
        }
    }

    async function add(factor: string) {
        openedDialog.current = !['passkey', 'security-key'].includes(factor);
        setBusy(true);

        if (factor === 'passkey' || factor === 'security-key') {
            // Runs the browser ceremony; the first extra factor comes with recovery codes.
            const result = await run(
                () => enroll(factor, { sign_out_others: alsoSignOut }),
                { reload: false },
            );
            showCodesOrReload(result?.recoveryCodes, result?.continue);
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
        <InsetCard aria-labelledby="sign-in-methods">
            <InsetCardHeader>
                <div>
                    <InsetCardTitle id="sign-in-methods">
                        Sign-in methods
                    </InsetCardTitle>
                    <InsetCardDescription>
                        Everything you can use to sign in. With a passkey,
                        security key or authenticator app set up, signing in
                        takes two factors. An emailed code adds a step, but it
                        isn't a second factor.
                    </InsetCardDescription>
                </div>

                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 self-start"
                            disabled={busy}
                        >
                            {busy ? <Spinner /> : <Plus />}
                            Add
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        onCloseAutoFocus={(event) => {
                            if (openedDialog.current) {
                                openedDialog.current = false;
                                event.preventDefault();
                            }
                        }}
                    >
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
                                        onPointerLeave={keepFocus}
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
                                        onPointerLeave={keepFocus}
                                    >
                                        <ShieldCheck />
                                        Recovery codes
                                    </DropdownMenuItem>
                                </>
                            )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </InsetCardHeader>

            <InsetCardList aria-label="Sign-in methods">
                <li className="px-4 py-3">
                    <div className="flex items-center gap-3">
                        <RowIcon icon={KeyRound} />
                        <div className="flex-1">
                            <p className="text-sm font-medium">Password</p>
                            <p className="text-xs text-muted-foreground">
                                What you sign in with first
                            </p>
                        </div>
                        {!mustChangePassword && (
                            <Button
                                variant="secondary"
                                size="sm"
                                aria-expanded={showPasswordForm}
                                aria-controls="change-password"
                                onClick={() =>
                                    setChangingPassword(!changingPassword)
                                }
                            >
                                Change
                            </Button>
                        )}
                    </div>

                    {showPasswordForm && (
                        <div
                            id="change-password"
                            className="mt-4 max-w-sm sm:pl-11"
                        >
                            <ChangePassword
                                onCancel={
                                    mustChangePassword
                                        ? undefined
                                        : () => setChangingPassword(false)
                                }
                            />
                        </div>
                    )}
                </li>

                {authenticators.map((authenticator) => (
                    <AuthenticatorItem
                        key={authenticator.id}
                        authenticator={authenticator}
                        signOutOthers={alsoSignOut}
                        onRegenerate={() => void add('recovery')}
                    />
                ))}
            </InsetCardList>

            {otherSessions > 0 && (
                <div className="flex items-center gap-2.5 px-3 pt-1.5 pb-2">
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
                onDone={(codes, continueTo) => {
                    setPending(null);
                    showCodesOrReload(codes, continueTo);
                }}
            />

            <RecoveryCodesDialog
                recovery={recovery}
                signOutOthers={alsoSignOut}
                onClose={() => {
                    const continueTo = recovery?.continue;
                    setRecovery(null);

                    if (continueTo) {
                        router.visit(continueTo);
                    } else {
                        router.reload();
                    }
                }}
            />
        </InsetCard>
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
        <li className="flex items-center gap-3 px-4 py-3">
            <RowIcon icon={Icon} />

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
                            <Badge variant="warning">Make a new set</Badge>
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
                    <Button variant="secondary" size="sm">
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
    onDone: (recoveryCodes: string[] | null, continueTo?: string) => void;
}) {
    const [code, setCode] = useState('');
    const [processing, setProcessing] = useState(false);
    const isTotp = pending?.factor === 'totp';
    // Keyring says how long an emailed code is; authenticator apps show six digits.
    const codeLength = isTotp ? 6 : Number(pending?.enrollment.length ?? 8);

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
                            className="rounded-lg bg-white p-3 shadow-raised"
                            // The QR code is an SVG string Keyring renders on the server.
                            dangerouslySetInnerHTML={{
                                __html: pending.enrollment.qr,
                            }}
                        />
                        <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs break-all">
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
                            onDone(
                                result.recoveryCodes ?? null,
                                result.continue,
                            );
                        }
                    }}
                >
                    <Label htmlFor="enroll-code">Code</Label>
                    <CodeInput
                        id="enroll-code"
                        length={codeLength}
                        value={code}
                        onChange={setCode}
                        className="mt-1"
                        autoFocus
                    />
                </form>

                <DialogFooter>
                    <Button
                        type="submit"
                        form="confirm-code"
                        disabled={processing || code.length !== codeLength}
                    >
                        {processing && <Spinner />}
                        Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
