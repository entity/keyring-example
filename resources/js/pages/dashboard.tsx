import { Head, Link, usePage } from '@inertiajs/react';
import { TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { ago } from '@/components/keyring/sign-in-methods';
import { dashboard } from '@/routes';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';

type KeyringAlert = {
    type: string;
    factor: string | null;
    at: string;
    ip: string | null;
};

// The entry types in keyring.security_log.alerts, which Keyring shows once
// after the next sign in.
const alertText: Record<string, string> = {
    second_factor_failed:
        'Someone entered your password but failed the second step',
    device_reported:
        'A device was signed out from a “this wasn’t me” link in an email',
    email_change_reverted: 'A change to your email address was undone',
    clone_suspected: 'One of your security keys looked like a copy',
    remember_me_reused:
        'A “remember me” cookie was used twice, so that session was ended',
};

const tour = [
    {
        title: 'Add a passkey',
        text: 'Settings → Security → Add → Passkey. Then sign out and use "Sign in with a passkey", or pick it from the email field’s autofill.',
        href: editSecurity(),
    },
    {
        title: 'Add a second factor',
        text: 'Everyone needs one here, so a new account is sent to Security until it has a passkey, a security key or an authenticator app. The first one comes with recovery codes.',
        href: editSecurity(),
    },
    {
        title: 'Try step-up',
        text: 'Security settings need a verification from the last 15 minutes, with the strongest proof your account has: if you have a security key, that’s what it asks for.',
        href: editSecurity(),
    },
    {
        title: 'See your sessions',
        text: 'Settings → Security lists every session and device. End one, or sign out everywhere else, also while adding or removing a sign-in method.',
        href: editSecurity(),
    },
    {
        title: 'Change your email',
        text: 'The new address must confirm, and the old one gets an undo link. The emails are in storage/logs/laravel.log.',
        href: editProfile(),
    },
];

export default function Dashboard() {
    const { keyringAlerts, replaceRecoveryCodes, statusMessage } = usePage<{
        keyringAlerts: KeyringAlert[];
        replaceRecoveryCodes: boolean;
        statusMessage: string | null;
    }>().props;

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {keyringAlerts.length > 0 && (
                    <Alert variant="destructive">
                        <TriangleAlert />
                        <AlertTitle>Was this you?</AlertTitle>
                        <AlertDescription>
                            <ul className="list-disc pl-4">
                                {keyringAlerts.map((alert) => (
                                    <li key={`${alert.type}:${alert.at}`}>
                                        {alertText[alert.type] ?? alert.type} (
                                        {alert.ip}, {ago(alert.at)})
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-2">
                                If not,{' '}
                                <Link
                                    href={editSecurity()}
                                    className="underline"
                                >
                                    check your devices and change your password
                                </Link>
                                .
                            </p>
                        </AlertDescription>
                    </Alert>
                )}

                {replaceRecoveryCodes && (
                    <Alert>
                        <TriangleAlert />
                        <AlertTitle>Make new recovery codes</AlertTitle>
                        <AlertDescription>
                            <p>
                                One of your recovery codes has been used.{' '}
                                <Link
                                    href={editSecurity()}
                                    className="underline"
                                >
                                    Make a new set
                                </Link>{' '}
                                and save it, so you still have a way back in.
                            </p>
                        </AlertDescription>
                    </Alert>
                )}

                {statusMessage && (
                    <p className="text-sm font-medium text-green-600">
                        {statusMessage}
                    </p>
                )}

                <div>
                    <h2 className="text-lg font-semibold">Keyring example</h2>
                    <p className="text-sm text-muted-foreground">
                        Things to try. Everything here is Keyring, swapped in
                        for Fortify.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {tour.map((step) => (
                        <Link
                            key={step.title}
                            href={step.href}
                            className="block"
                        >
                            <Card className="h-full transition-colors hover:bg-muted/50">
                                <CardHeader>
                                    <CardTitle>{step.title}</CardTitle>
                                    <CardDescription>
                                        {step.text}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent />
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
