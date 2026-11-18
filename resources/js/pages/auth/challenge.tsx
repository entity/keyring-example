import {
    useChallenge,
    type Challenge as ChallengeState,
    type ChallengeProps,
} from '@keyringjs/keyring/react';
import { Head } from '@inertiajs/react';
import {
    ChevronRight,
    Fingerprint,
    KeyRound,
    LifeBuoy,
    Mail,
    ShieldCheck,
    Smartphone,
    Usb,
    type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { codeLength, factors } from '@/keyring/factors';
import { cn } from '@/lib/utils';

const factorLabels: Record<string, string> = {
    password: 'Password',
    passkey: 'Passkey',
    'security-key': 'Security key',
    totp: 'Authenticator app',
    'email-code': 'Email code',
    recovery: 'Recovery code',
};

const factorIcons: Record<string, LucideIcon> = {
    password: KeyRound,
    passkey: Fingerprint,
    'security-key': Usb,
    totp: Smartphone,
    'email-code': Mail,
    recovery: LifeBuoy,
};

// What a step-up asks for depends on the account: the strongest proof it has.
const confirmCopy: Record<string, string> = {
    'security-key':
        'This changes how you sign in, so we need your security key: the strongest proof your account has.',
    passkey:
        'This changes how you sign in, so we need your passkey: the strongest proof your account has.',
};

/** What to do, under the heading. */
function prompt(challenge: ChallengeState): React.ReactNode {
    const { props } = challenge;

    switch (props.factor) {
        case 'password':
            return 'Enter your password to continue.';
        case 'totp':
            return `Enter the ${codeLength(challenge)}-digit code from your authenticator app.`;
        case 'email-code':
            return (
                <>
                    {props.challenge.sent
                        ? `Enter the ${codeLength(challenge)}-digit code we sent to`
                        : 'We’ll email a code to'}{' '}
                    <span className="block font-medium text-foreground">
                        {props.authenticator.hint}
                    </span>
                </>
            );
        case 'recovery':
            return 'Enter one of the recovery codes you saved.';
        case 'passkey':
            return 'Use your passkey to continue.';
        case 'security-key':
            return `Insert and tap your security key (${props.authenticator.name}).`;
        default:
            return 'Use one of your sign-in methods to continue.';
    }
}

/**
 * Keyring renders this page for the second step of signing in
 * (purpose "login") and for step-up confirmation (purpose "confirm").
 */
export default function Challenge(props: ChallengeProps) {
    const challenge = useChallenge(props, factors);
    const [showAlternatives, setShowAlternatives] = useState(false);
    const Factor = challenge.Component;
    const Icon = factorIcons[props.factor] ?? ShieldCheck;
    const title =
        props.purpose === 'login' ? 'Verify it’s you' : 'Confirm it’s you';
    const description =
        props.purpose === 'confirm' && confirmCopy[props.factor] ? (
            confirmCopy[props.factor]
        ) : props.purpose === 'confirm' ? (
            <>
                This changes how you sign in, so we need to check it’s really
                you. {prompt(challenge)}
            </>
        ) : (
            prompt(challenge)
        );

    return (
        <>
            <Head title={title} />

            <div className="grid gap-6">
                <header className="flex flex-col items-center gap-4 text-center">
                    <span className="flex size-12 items-center justify-center rounded-full bg-linear-to-b from-accent-400 to-accent-700 text-white shadow-[inset_0_1px_0_0_rgb(255_255_255/0.25),0_0_0_4px_var(--color-accent-0),0_0_0_5px_var(--color-accent-50),0_2px_4px_0_rgb(0_0_0/0.15)] dark:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.2),0_0_0_4px_rgb(255_255_255/0.04),0_0_0_4.5px_var(--color-deep-gray-600),0_2px_4px_0_rgb(0_0_0/0.5)]">
                        <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div className="space-y-1.5">
                        <h1 className="text-xl font-medium tracking-tight">
                            {title}
                        </h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            {description}
                        </p>
                    </div>
                </header>

                {Factor ? (
                    <Factor
                        key={`${props.factor}:${props.authenticator.id}`}
                        challenge={challenge}
                    />
                ) : (
                    <p className="text-sm text-destructive-foreground">
                        This page doesn't know the "{props.factor}" factor yet.
                    </p>
                )}

                {props.canTrustDevice && (
                    <div className="flex items-center gap-2.5">
                        <Checkbox
                            id="trust"
                            checked={challenge.form.data.trust}
                            onCheckedChange={(checked) =>
                                challenge.form.setData(
                                    'trust',
                                    checked === true,
                                )
                            }
                        />
                        <Label htmlFor="trust">
                            Don't ask again on this device
                        </Label>
                    </div>
                )}

                {props.alternatives.length > 0 && (
                    <div className="-mx-6 -mb-6 rounded-b-2xl border-t bg-tint px-6 py-4 sm:-mx-8 sm:-mb-8 sm:px-8">
                        <p className="text-center text-[13px] text-muted-foreground">
                            Can’t use this?{' '}
                            <button
                                type="button"
                                aria-expanded={showAlternatives}
                                aria-controls="alternatives"
                                className="font-medium text-foreground underline decoration-border underline-offset-4 outline-none hover:decoration-current focus-visible:decoration-current"
                                onClick={() =>
                                    setShowAlternatives(!showAlternatives)
                                }
                            >
                                Try another way
                            </button>
                        </p>

                        {showAlternatives && (
                            <ul
                                id="alternatives"
                                className="mt-4 grid gap-1 rounded-xl bg-card p-1 shadow-card"
                            >
                                {props.alternatives.map((option) => {
                                    const OptionIcon =
                                        factorIcons[option.factor] ??
                                        ShieldCheck;

                                    return (
                                        <li
                                            key={`${option.factor}:${option.id}`}
                                        >
                                            <button
                                                type="button"
                                                className={cn(
                                                    'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 outline-none hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring',
                                                )}
                                                onClick={() =>
                                                    challenge.switchTo(option)
                                                }
                                            >
                                                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tint text-muted-foreground shadow-raised">
                                                    <OptionIcon
                                                        className="size-4"
                                                        aria-hidden="true"
                                                    />
                                                </span>
                                                <span className="grid min-w-0 flex-1">
                                                    <span className="truncate text-sm font-medium">
                                                        {option.name}
                                                    </span>
                                                    <span className="truncate text-xs text-muted-foreground">
                                                        {option.hint ??
                                                            factorLabels[
                                                                option.factor
                                                            ] ??
                                                            option.factor}
                                                    </span>
                                                </span>
                                                <ChevronRight
                                                    className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none"
                                                    aria-hidden="true"
                                                />
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
