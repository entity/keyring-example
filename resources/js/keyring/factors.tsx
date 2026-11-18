import type { Challenge, FactorComponent } from '@keyringjs/keyring/react';
import { useEffect, useRef } from 'react';
import CodeInput from '@/components/code-input';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

function SubmitButton({
    challenge,
    disabled = false,
    children,
}: {
    challenge: Challenge;
    /** Until the answer is complete. */
    disabled?: boolean;
    children: React.ReactNode;
}) {
    return (
        <Button
            type="submit"
            className="w-full"
            disabled={disabled || challenge.form.processing}
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

/** How many digits a numeric code has: Keyring says for emailed ones. */
export function codeLength(challenge: Challenge): number {
    return challenge.props.factor === 'email-code'
        ? Number(challenge.props.challenge.length ?? 8)
        : 6;
}

function Code({ challenge }: { challenge: Challenge }) {
    const { props, form } = challenge;
    const sendsCodes = props.factor === 'email-code';

    if (sendsCodes && !props.challenge.sent) {
        return (
            <div className="grid gap-4 text-center">
                <p className="text-[13px] text-muted-foreground">
                    It's an extra step after your password, not a second factor.
                </p>
                <Button className="w-full" onClick={() => challenge.send()}>
                    Send code
                </Button>
            </div>
        );
    }

    if (props.factor === 'recovery') {
        return (
            <form
                className="grid gap-6"
                onSubmit={(event) => {
                    event.preventDefault();
                    challenge.submit();
                }}
            >
                <div className="grid gap-2">
                    <Label htmlFor="code">Recovery code</Label>
                    <Input
                        id="code"
                        className="font-mono tracking-wider"
                        autoComplete="one-time-code"
                        autoCapitalize="none"
                        spellCheck={false}
                        autoFocus
                        required
                        aria-invalid={form.errors.code ? true : undefined}
                        aria-describedby="code-hint"
                        value={form.data.code}
                        onChange={(event) =>
                            form.setData('code', event.target.value)
                        }
                    />
                    <p id="code-hint" className="text-xs text-muted-foreground">
                        Dashes or not. {props.authenticator.remaining ?? 0}{' '}
                        left.
                    </p>
                    <InputError message={form.errors.code} />
                </div>
                <SubmitButton challenge={challenge}>Verify</SubmitButton>
            </form>
        );
    }

    const length = codeLength(challenge);
    const complete = form.data.code.length === length;

    return (
        <form
            className="grid gap-6"
            onSubmit={(event) => {
                event.preventDefault();

                if (complete) {
                    challenge.submit();
                }
            }}
        >
            <div className="grid gap-3">
                {/* The heading above says where the code comes from, so
                    the label is for screen readers (and tests) only. */}
                <Label htmlFor="code" className="sr-only">
                    {sendsCodes
                        ? 'Code from your email'
                        : 'Code from your authenticator app'}
                </Label>
                <CodeInput
                    id="code"
                    length={length}
                    value={form.data.code}
                    onChange={(code) => form.setData('code', code)}
                    invalid={Boolean(form.errors.code)}
                    aria-describedby={
                        form.errors.code ? 'code-error' : undefined
                    }
                    autoFocus
                />
                <InputError
                    id="code-error"
                    className="text-center"
                    message={form.errors.code}
                />
            </div>

            {sendsCodes && (
                <p className="text-center text-[13px] text-muted-foreground">
                    Didn't get it?{' '}
                    <button
                        type="button"
                        className="font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:underline dark:text-accent-200"
                        onClick={() => challenge.send()}
                    >
                        Send a new code
                    </button>
                </p>
            )}

            <SubmitButton challenge={challenge} disabled={!complete}>
                Verify
            </SubmitButton>
        </form>
    );
}

function SecurityKey({ challenge }: { challenge: Challenge }) {
    const { verifyKey } = challenge;

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
