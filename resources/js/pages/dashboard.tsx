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

const alertText: Record<string, string> = {
    second_factor_failed:
        'Someone entered your password but failed the second step',
    factor_failed: 'Someone tried to sign in with the wrong password or code',
    locked_out: 'Sign-in was paused after too many attempts',
    new_device: 'Your account was signed in to from a new device',
};

const tour = [
    {
        title: 'Add a passkey',
        text: 'Settings → Security → Add → Passkey. Then sign out and use "Sign in with a passkey", or pick it from the email field’s autofill.',
        href: editSecurity(),
    },
    {
        title: 'Turn on two steps',
        text: 'Add an authenticator app. You get recovery codes with it, and signing in now asks for a code after your password.',
        href: editSecurity(),
    },
    {
        title: 'Try step-up',
        text: 'Security settings need a verification from the last 15 minutes. With a second method set up, the password alone isn’t enough.',
        href: editSecurity(),
    },
    {
        title: 'Change your email',
        text: 'The new address must confirm, and the old one gets an undo link. The emails are in storage/logs/laravel.log.',
        href: editProfile(),
    },
];

export default function Dashboard() {
    const { keyringAlerts, statusMessage } = usePage<{
        keyringAlerts: KeyringAlert[];
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
