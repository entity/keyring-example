import type { Session } from '@entity/keyring/react';
import { Form, Head, usePage } from '@inertiajs/react';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import Activity, { type ActivityRow } from '@/components/keyring/activity';
import Devices, { type DeviceRow } from '@/components/keyring/devices';
import Sessions from '@/components/keyring/sessions';
import SignInMethods, {
    type AuthenticatorRow,
} from '@/components/keyring/sign-in-methods';
import PasswordInput from '@/components/password-input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/security';

type Props = {
    authenticators: AuthenticatorRow[];
    enrollable: string[];
    devices: DeviceRow[];
    sessions: Session[];
    activity: ActivityRow[];
    assurance: 'None' | 'AAL1' | 'AAL2' | 'AAL3';
    /** A passkey, security key or authenticator app. Emailed codes aren't one. */
    hasSecondFactor: boolean;
    /** Held by Keyring::requirePasswordChange() until the password changes. */
    mustChangePassword: boolean;
};

// What the session has proved, as Keyring counts it. A password and an
// emailed code is still one factor, and AAL3 takes a security key whose
// maker vouched for it when it was added (SECURITY_KEY_ATTESTATION).
const assuranceLabels: Record<Props['assurance'], string> = {
    None: 'Nothing proved lately',
    AAL1: 'One factor (AAL1)',
    AAL2: 'Two factors (AAL2)',
    AAL3: 'Attested security key (AAL3)',
};

// Shown in the notices below instead of as a toast.
const noticeStatuses = ['enroll-first', 'change-password'];

export default function Security({
    authenticators,
    enrollable,
    devices,
    sessions,
    activity,
    assurance,
    hasSecondFactor,
    mustChangePassword,
}: Props) {
    const { status, statusMessage } = usePage<{
        status: string | null;
        statusMessage: string | null;
    }>().props;

    // Keyring's device and password routes flash a status and come back here.
    useEffect(() => {
        if (statusMessage && !noticeStatuses.includes(status ?? '')) {
            toast.success(statusMessage);
        }
    }, [status, statusMessage]);

    return (
        <>
            <Head title="Security settings" />

            <h1 className="sr-only">Security settings</h1>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                This session:
                <Badge variant="outline">{assuranceLabels[assurance]}</Badge>
            </div>

            {/* Keyring sends people here from every other page while one of
                these is true (keyring.password_change_url and
                keyring.enrollment_url), so the page says why. */}
            {mustChangePassword && (
                <Alert variant="destructive">
                    <ShieldAlert />
                    <AlertTitle>Choose a new password to carry on</AlertTitle>
                    <AlertDescription>
                        Your password may be known to someone else, so the rest
                        of the app is closed until you change it below.
                    </AlertDescription>
                </Alert>
            )}

            {!hasSecondFactor && (
                <Alert>
                    <KeyRound />
                    <AlertTitle>Add a second factor to carry on</AlertTitle>
                    <AlertDescription>
                        Everyone here signs in with two factors. Add a passkey,
                        a security key or an authenticator app below, and the
                        rest of the app opens up. An emailed code doesn’t count:
                        it’s an extra step, not a second factor.
                    </AlertDescription>
                </Alert>
            )}

            <SignInMethods
                authenticators={authenticators}
                enrollable={enrollable}
                hasSecondFactor={hasSecondFactor}
                otherSessions={
                    sessions.filter((session) => !session.current).length
                }
            />

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Change password"
                    description="Use at least 15 characters, or 8 once you have a second factor. Your other sessions are signed out."
                />

                <Form
                    action="/user/password"
                    method="put"
                    options={{ preserveScroll: true }}
                    resetOnSuccess
                    resetOnError={[
                        'password',
                        'password_confirmation',
                        'current_password',
                    ]}
                    className="space-y-6"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="current_password">
                                    Current password
                                </Label>
                                <PasswordInput
                                    id="current_password"
                                    name="current_password"
                                    autoComplete="current-password"
                                />
                                <InputError message={errors.current_password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">New password</Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    autoComplete="new-password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm new password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    autoComplete="new-password"
                                />
                            </div>

                            <Button disabled={processing}>Save</Button>
                        </>
                    )}
                </Form>
            </div>

            <Devices devices={devices} />

            <Sessions sessions={sessions} />

            <Activity activity={activity} />
        </>
    );
}

Security.layout = {
    breadcrumbs: [
        {
            title: 'Security settings',
            href: edit(),
        },
    ],
};
