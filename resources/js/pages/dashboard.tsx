import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, TriangleAlert } from 'lucide-react';
import { ago } from '@/components/keyring/sign-in-methods';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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

type DemoSettings = {
    /** Which locator KEYRING_LOCATOR picked, if any. */
    locator: 'demo' | 'cloudflare' | 'other' | null;
    /** BREACHED_PASSWORD_CHECK. */
    breachCheck: boolean;
    /** The /emails previews, which only exist while running locally. */
    emailPreviews: boolean;
};

type Step = {
    title: string;
    text: string;
    /** Where to go to try it. */
    href: string | ReturnType<typeof editSecurity>;
    where: string;
    /** For the ones that need a setting: whether it's on. */
    setting?: { on: boolean; name: string };
    external?: boolean;
};

function tour(settings: DemoSettings): Step[] {
    return [
        {
            title: 'Add a passkey',
            text: 'Add one, then sign out and use “Sign in with a passkey”, or pick it from the email field’s autofill.',
            href: editSecurity(),
            where: 'Settings → Security → Add',
        },
        {
            title: 'Add a second factor',
            text: 'Everyone needs one here, so a new account is sent to Security until it has a passkey, a security key or an authenticator app. The first one comes with recovery codes.',
            href: editSecurity(),
            where: 'Settings → Security',
        },
        {
            title: 'Try step-up',
            text: 'Security settings need a verification from the last 15 minutes, with the strongest proof your account has: if you have a security key, that’s what it asks for.',
            href: editSecurity(),
            where: 'Settings → Security',
        },
        {
            title: 'End your other sessions',
            text: 'Sign in from a second browser, then see both here. End one, sign out everywhere else, or tick the box to do it while adding or removing a sign-in method.',
            href: editSecurity(),
            where: 'Settings → Security',
        },
        {
            title: 'Trip a risk signal',
            text: 'Get the password wrong five times, wait a minute, then sign in: Keyring emails you about the failed attempts. Get the password right and the code wrong, and the next sign in asks “Was this you?”. Recent activity shows what was found and what was done.',
            href: editSecurity(),
            where: 'Settings → Security → Recent activity',
        },
        {
            title: 'Travel faster than a plane',
            text:
                settings.locator === 'demo'
                    ? 'Sign out and pick a city on the login page. Paris after London is a new country, and asks for a second factor. Tokyo a minute later is impossible travel too, and the sign in is refused.'
                    : 'Start the app with KEYRING_LOCATOR=demo and the login page lets you pretend to be in London, Paris, New York or Tokyo, to trip the new country and impossible travel signals.',
            href: editSecurity(),
            where: 'Settings → Security → devices',
            setting: {
                on: settings.locator === 'demo',
                name: 'KEYRING_LOCATOR=demo',
            },
        },
        {
            title: 'Use a breached password',
            text: 'With the check on, signing in with a password from a known breach holds you on Security until you choose another (the demo accounts’ “password” is one), and a breached new password is refused. Every check asks Have I Been Pwned, so it’s off unless you turn it on.',
            href: editSecurity(),
            where: 'Settings → Security → Change password',
            setting: {
                on: settings.breachCheck,
                name: 'BREACHED_PASSWORD_CHECK=true',
            },
        },
        {
            title: 'Change your email',
            text: 'The new address must confirm, and the old one gets an undo link. For a week afterwards, a sign in counts the change as a risk signal.',
            href: editProfile(),
            where: 'Settings → Profile',
        },
        {
            title: 'Read the emails',
            text: settings.emailPreviews
                ? 'Every email Keyring sends, with sample content. The ones sent for real go to storage/logs/laravel.log.'
                : 'Emails go to storage/logs/laravel.log. While running locally, /emails shows every one Keyring sends, with sample content.',
            href: '/emails',
            where: '/emails',
            setting: { on: settings.emailPreviews, name: 'APP_ENV=local' },
            external: true,
        },
    ];
}

export default function Dashboard() {
    const { keyringAlerts, replaceRecoveryCodes, statusMessage, demoSettings } =
        usePage<{
            keyringAlerts: KeyringAlert[];
            replaceRecoveryCodes: boolean;
            statusMessage: string | null;
            demoSettings: DemoSettings;
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
                    <h2 className="text-lg font-semibold">Things to try</h2>
                    <p className="text-sm text-muted-foreground">
                        Everything here is Keyring, swapped in for Fortify. The{' '}
                        <a
                            href="https://github.com/entity/keyring/tree/main/docs"
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-4"
                        >
                            docs
                        </a>{' '}
                        explain each one.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {tour(demoSettings).map((step) => {
                        const card = (
                            <Card className="h-full gap-3 transition-colors group-hover:bg-muted/50 group-focus-visible:bg-muted/50">
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="leading-snug">
                                            {step.title}
                                        </CardTitle>
                                        {step.setting && (
                                            <Badge
                                                variant={
                                                    step.setting.on
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                className="shrink-0"
                                                title={step.setting.name}
                                            >
                                                {step.setting.on ? 'On' : 'Off'}
                                            </Badge>
                                        )}
                                    </div>
                                    <CardDescription>
                                        {step.text}
                                    </CardDescription>
                                </CardHeader>
                                <CardFooter className="mt-auto flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
                                    {step.setting && !step.setting.on ? (
                                        <>
                                            Needs{' '}
                                            <code className="font-mono">
                                                {step.setting.name}
                                            </code>
                                        </>
                                    ) : (
                                        <>
                                            {step.where}
                                            <ArrowRight className="size-3" />
                                        </>
                                    )}
                                </CardFooter>
                            </Card>
                        );

                        const className =
                            'group block rounded-xl focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none';

                        return step.external ? (
                            <a
                                key={step.title}
                                href={step.href as string}
                                target="_blank"
                                rel="noreferrer"
                                className={className}
                            >
                                {card}
                            </a>
                        ) : (
                            <Link
                                key={step.title}
                                href={step.href}
                                className={className}
                            >
                                {card}
                            </Link>
                        );
                    })}
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
