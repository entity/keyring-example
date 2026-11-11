import type { Challenge, FactorComponent } from '@entity/keyring/react';
import { useEffect, useRef } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

function SubmitButton({
    challenge,
    children,
}: {
    challenge: Challenge;
    children: React.ReactNode;
}) {
    return (
        <Button
            type="submit"
            className="w-full"
            disabled={challenge.form.processing}
        >
            {challenge.form.processing && <Spinner />}
            {children}
        </Button>
    );
}

function Password({ challenge }: { challenge: Challenge }) {
    return (
        <form
            className="grid gap-6"
            onSubmit={(event) => {
                event.preventDefault();
                challenge.submit();
            }}
        >
            <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                    id="password"
                    autoComplete="current-password"
                    autoFocus
                    required
                    value={challenge.form.data.password}
                    onChange={(event) =>
                        challenge.form.setData('password', event.target.value)
                    }
                />
                <InputError message={challenge.form.errors.password} />
            </div>
            <SubmitButton challenge={challenge}>Continue</SubmitButton>
        </form>
    );
}

const codeCopy: Record<
    string,
    (challenge: Challenge) => { label: string; hint?: string; numeric: boolean }
> = {
    totp: (challenge) => ({
        label: 'Code from your authenticator app',
        hint: challenge.props.authenticator.name,
        numeric: true,
    }),
    'email-code': (challenge) => ({
        label: 'Code from your email',
        hint: `Sent to ${challenge.props.authenticator.hint}`,
        numeric: true,
    }),
    recovery: (challenge) => ({
        label: 'Recovery code',
        hint: `One of the codes you saved, dashes or not. ${challenge.props.authenticator.remaining ?? 0} left.`,
        numeric: false,
    }),
};

function Code({ challenge }: { challenge: Challenge }) {
    const { props } = challenge;
    const copy = codeCopy[props.factor]?.(challenge) ?? {
        label: 'Code',
        numeric: false,
    };
    const sendsCodes = props.factor === 'email-code';

    if (sendsCodes && !props.challenge.sent) {
        return (
            <div className="grid gap-4 text-center">
                <p className="text-sm text-muted-foreground">
                    We'll email a code to {props.authenticator.hint}. It's an
                    extra step after your password, not a second factor.
                </p>
                <Button className="w-full" onClick={() => challenge.send()}>
                    Send code
                </Button>
            </div>
        );
    }

    return (
        <form
            className="grid gap-6"
            onSubmit={(event) => {
                event.preventDefault();
                challenge.submit();
            }}
        >
            <div className="grid gap-2">
                <Label htmlFor="code">{copy.label}</Label>
                {copy.hint && (
                    <p className="-mt-1 text-xs text-muted-foreground">
                        {copy.hint}
                    </p>
                )}
                <Input
                    id="code"
                    className="font-mono tracking-widest"
                    inputMode={copy.numeric ? 'numeric' : 'text'}
                    autoComplete="one-time-code"
                    autoFocus
                    required
                    value={challenge.form.data.code}
                    onChange={(event) =>
                        challenge.form.setData('code', event.target.value)
                    }
                />
                <InputError message={challenge.form.errors.code} />
            </div>
            <SubmitButton challenge={challenge}>Verify</SubmitButton>
            {sendsCodes && (
                <Button
                    type="button"
                    variant="link"
                    onClick={() => challenge.send()}
                >
                    Send a new code
                </Button>
            )}
        </form>
    );
}

function SecurityKey({ challenge }: { challenge: Challenge }) {
    const { props, verifyKey } = challenge;

    const asked = useRef(false);

    // Ask once straight away. The button is there if the prompt was dismissed.
    useEffect(() => {
        if (!asked.current) {
            asked.current = true;
            void verifyKey();
        }
    }, [verifyKey]);

    return (
        <div className="grid gap-4 text-center">
            <p className="text-sm text-muted-foreground">
                {props.factor === 'passkey'
                    ? 'Use your passkey to continue.'
                    : `Insert and tap your security key (${props.authenticator.name}).`}
            </p>
            <InputError message={challenge.form.errors.credential} />
            <Button
                className="w-full"
                disabled={challenge.form.processing}
                onClick={() => void verifyKey()}
            >
                {challenge.form.processing && <Spinner />}
                Try again
            </Button>
        </div>
    );
}

/**
 * One component per factor. Adding a factor on the server? Add a line here.
 */
export const factors: Record<string, FactorComponent> = {
    password: Password,
    totp: Code,
    'email-code': Code,
    recovery: Code,
    passkey: SecurityKey,
    'security-key': SecurityKey,
};
