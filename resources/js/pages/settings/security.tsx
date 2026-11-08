import { Form, Head, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import Activity, { type ActivityRow } from '@/components/keyring/activity';
import Devices, { type DeviceRow } from '@/components/keyring/devices';
import SignInMethods, {
    type AuthenticatorRow,
} from '@/components/keyring/sign-in-methods';
import PasswordInput from '@/components/password-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/security';

type Props = {
    authenticators: AuthenticatorRow[];
    enrollable: string[];
    devices: DeviceRow[];
    activity: ActivityRow[];
    assurance: 'None' | 'AAL1' | 'AAL2' | 'AAL3';
};

const assuranceLabels: Record<Props['assurance'], string> = {
    None: 'Not verified',
    AAL1: 'One factor (AAL1)',
    AAL2: 'Two factors (AAL2)',
    AAL3: 'Phishing-resistant (AAL3)',
};

export default function Security({
    authenticators,
    enrollable,
    devices,
    activity,
    assurance,
}: Props) {
    const { statusMessage } = usePage<{ statusMessage: string | null }>().props;

    // Keyring's device and password routes flash a status and come back here.
    useEffect(() => {
        if (statusMessage) {
            toast.success(statusMessage);
        }
    }, [statusMessage]);

    return (
        <>
            <Head title="Security settings" />

            <h1 className="sr-only">Security settings</h1>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                This session:
                <Badge variant="outline">{assuranceLabels[assurance]}</Badge>
            </div>

            <SignInMethods
                authenticators={authenticators}
                enrollable={enrollable}
            />

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Change password"
                    description="Use at least 15 characters, or 8 once you have a second sign-in method. Other devices are signed out."
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
