import {
    beginEnrollment,
    confirmEnrollment,
    enroll,
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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { run } from '@/keyring/actions';

export type AuthenticatorRow = {
    factor: string;
    id: string;
    name: string;
    hint?: string;
    remaining?: number;
    isDefault: boolean;
    createdAt: string | null;
    lastUsedAt: string | null;
};

const factorInfo: Record<string, { label: string; icon: typeof KeyRound }> = {
    passkey: { label: 'Passkey', icon: Fingerprint },
    'security-key': { label: 'Security key', icon: KeyRound },
    totp: { label: 'Authenticator app', icon: Smartphone },
    'email-code': { label: 'Email code', icon: Mail },
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
}: {
    authenticators: AuthenticatorRow[];
    enrollable: string[];
}) {
    const [pending, setPending] = useState<Pending>(null);
    const [recovery, setRecovery] = useState<Recovery>(null);
    const [busy, setBusy] = useState(false);
    const webauthn = supportsWebAuthn();

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
            const result = await run(() => enroll(factor), {
                reload: false,
            });
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
                    description="Everything you can use to sign in. With a second method set up, signing in takes two steps."
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
                                const { label, icon: Icon } = factorInfo[
                                    factor
                                ] ?? { label: factor, icon: KeyRound };

                                return (
                                    <DropdownMenuItem
                                        key={factor}
                                        onSelect={() => void add(factor)}
                                    >
                                        <Icon />
                                        {label}
                                    </DropdownMenuItem>
                                );
                            })}
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
                        onRegenerate={() => void add('recovery')}
                    />
                ))}
            </ul>

            <ConfirmCodeDialog
                pending={pending}
                onDone={(codes) => {
                    setPending(null);
                    showCodesOrReload(codes);
                }}
            />

            <RecoveryCodesDialog
                recovery={recovery}
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
    onRegenerate,
}: {
    authenticator: AuthenticatorRow;
    onRegenerate: () => void;
}) {
    const [renaming, setRenaming] = useState(false);
    const [name, setName] = useState(authenticator.name);
    const { label, icon: Icon } = factorInfo[authenticator.factor] ?? {
        label: authenticator.factor,
        icon: KeyRound,
    };
    const isRecovery = authenticator.factor === 'recovery';

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
                    </p>
                )}
                <p className="text-xs text-muted-foreground">
                    {isRecovery
                        ? `${authenticator.remaining ?? 0} codes left`
                        : `${label}${authenticator.hint ? ` · ${authenticator.hint}` : ''} · last used ${ago(authenticator.lastUsedAt)}`}
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
                        onSelect={() =>
                            void run(() =>
                                removeAuthenticator(authenticator.id),
                            )
                        }
                    >
                        Remove
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </li>
    );
}

/**
 * The second half of adding an authenticator app or email codes: show the QR
 * code (or say a code was sent), then confirm with a code.
 */
function ConfirmCodeDialog({
    pending,
    onDone,
}: {
    pending: Pending;
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
                            : 'We emailed you a code. Enter it to finish.'}
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
                                    { code },
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
