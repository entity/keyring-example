import { useChallenge, type ChallengeProps } from '@entity/keyring/react';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { factors } from '@/keyring/factors';

const factorLabels: Record<string, string> = {
    password: 'Password',
    passkey: 'Passkey',
    'security-key': 'Security key',
    totp: 'Authenticator app',
    'email-code': 'Email code',
    recovery: 'Recovery code',
};

/**
 * Keyring renders this page for the second step of signing in
 * (purpose "login") and for step-up confirmation (purpose "confirm").
 */
export default function Challenge(props: ChallengeProps) {
    const challenge = useChallenge(props, factors);
    const [showAlternatives, setShowAlternatives] = useState(false);
    const Factor = challenge.Component;

    return (
        <>
            <Head
                title={
                    props.purpose === 'login'
                        ? 'Verify it’s you'
                        : 'Confirm it’s you'
                }
            />

            <div className="grid gap-6">
                {props.purpose === 'confirm' && (
                    <p className="text-center text-sm text-muted-foreground">
                        This changes how you sign in, so we need to check it’s
                        really you.
                    </p>
                )}

                {Factor ? (
                    <Factor
                        key={`${props.factor}:${props.authenticator.id}`}
                        challenge={challenge}
                    />
                ) : (
                    <p className="text-sm text-destructive">
                        This page doesn't know the "{props.factor}" factor yet.
                    </p>
                )}

                {props.canTrustDevice && (
                    <div className="flex items-center space-x-3">
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
                    <div className="border-t pt-4">
                        <Button
                            type="button"
                            variant="link"
                            className="h-auto p-0 text-muted-foreground"
                            onClick={() =>
                                setShowAlternatives(!showAlternatives)
                            }
                        >
                            Try another way
                        </Button>

                        {showAlternatives && (
                            <ul className="mt-3 grid gap-2">
                                {props.alternatives.map((option) => (
                                    <li key={`${option.factor}:${option.id}`}>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-auto w-full flex-col items-start py-2"
                                            onClick={() =>
                                                challenge.switchTo(option)
                                            }
                                        >
                                            <span>{option.name}</span>
                                            <span className="text-xs font-normal text-muted-foreground">
                                                {option.hint ??
                                                    factorLabels[
                                                        option.factor
                                                    ] ??
                                                    option.factor}
                                            </span>
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

Challenge.layout = {
    title: 'Verify it’s you',
    description: 'Use one of your sign-in methods to continue.',
};
