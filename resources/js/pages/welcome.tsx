import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    Check,
    Copy,
    Fingerprint,
    History,
    MapPin,
    MonitorSmartphone,
    ShieldCheck,
    Smartphone,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useClipboard } from '@/hooks/use-clipboard';
import { dashboard, login, register } from '@/routes';

type Props = {
    /** What DatabaseSeeder makes, for signing in to the demo. */
    demoAccounts: {
        password: string;
        totpSecret: string;
        recoveryCode: string;
        /** The secret as a QR code (an SVG string made on the server). */
        totpQr: string;
    };
};

const docs = 'https://github.com/entity/keyring/tree/main/docs';
const repository = 'https://github.com/entity/keyring-example';

const tryThis = [
    {
        icon: Fingerprint,
        title: 'Passkeys',
        text: 'Add one, sign out, and sign in from the email field’s autofill or with “Sign in with a passkey”.',
    },
    {
        icon: Smartphone,
        title: 'Second factors',
        text: 'An authenticator app, a security key or a passkey, with recovery codes as a way back in. An emailed code is on offer too, as an extra step that isn’t a second factor.',
    },
    {
        icon: ShieldCheck,
        title: 'Step-up',
        text: 'Security settings ask you to verify again after 15 minutes, with the strongest proof the account has.',
    },
    {
        icon: MonitorSmartphone,
        title: 'Devices and sessions',
        text: 'See every browser and session signed in, end one, or sign out everywhere else.',
    },
    {
        icon: MapPin,
        title: 'Risk signals',
        text: 'A new device, a run of failed attempts, a new country or impossible travel. Start the app with KEYRING_LOCATOR=demo to pick a city on the login page.',
    },
    {
        icon: History,
        title: 'The security log and emails',
        text: 'Every sign in and change is listed under Settings → Security. Emails go to storage/logs/laravel.log, and /emails shows each one while running locally.',
    },
];

export default function Welcome({ demoAccounts }: Props) {
    const { auth, name } = usePage().props;

    return (
        <>
            <Head title="Welcome" />

            <div className="min-h-svh bg-background text-foreground">
                <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
                    <Link
                        href="/"
                        className="flex items-center gap-2 font-semibold"
                    >
                        <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <AppLogoIcon className="size-5 fill-current" />
                        </span>
                        {name}
                    </Link>

                    <nav className="flex items-center gap-2">
                        {auth.user ? (
                            <Button asChild variant="outline" size="sm">
                                <Link href={dashboard()}>Dashboard</Link>
                            </Button>
                        ) : (
                            <>
                                <Button asChild variant="ghost" size="sm">
                                    <Link href={login()}>Log in</Link>
                                </Button>
                                <Button asChild variant="outline" size="sm">
                                    <Link href={register()}>Register</Link>
                                </Button>
                            </>
                        )}
                    </nav>
                </header>

                <main className="mx-auto w-full max-w-5xl space-y-14 px-4 pt-8 pb-16 sm:px-6 lg:pt-16">
                    <section className="max-w-2xl space-y-5">
                        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                            Keyring, in a real app
                        </h1>
                        <p className="text-base text-muted-foreground sm:text-lg">
                            This is Laravel’s React starter kit with Fortify
                            taken out and Keyring put in. Sign in with one of
                            the demo accounts below, or register your own, and
                            try passkeys, second factors, step-up, devices and
                            sessions, risk signals and the security log.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            {auth.user ? (
                                <Button asChild>
                                    <Link href={dashboard()}>
                                        Go to the dashboard
                                    </Link>
                                </Button>
                            ) : (
                                <Button asChild>
                                    <Link href={login()}>Log in</Link>
                                </Button>
                            )}
                            <Button asChild variant="outline">
                                <a href={docs} target="_blank" rel="noreferrer">
                                    Keyring docs
                                    <ArrowUpRight />
                                </a>
                            </Button>
                            <Button asChild variant="ghost">
                                <a
                                    href={repository}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    This app’s code
                                    <ArrowUpRight />
                                </a>
                            </Button>
                        </div>
                    </section>

                    <section aria-labelledby="accounts" className="space-y-4">
                        <div className="space-y-1">
                            <h2
                                id="accounts"
                                className="text-xl font-semibold tracking-tight"
                            >
                                Demo accounts
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Both use the password{' '}
                                <code className="rounded bg-muted px-1 font-mono">
                                    {demoAccounts.password}
                                </code>
                                . To put them back the way they started, run{' '}
                                <code className="rounded bg-muted px-1 font-mono">
                                    php artisan example:reset
                                </code>
                                .
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 md:items-start">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Password only</CardTitle>
                                    <CardDescription>
                                        Everyone needs a second factor here, so
                                        signing in takes you to Settings →
                                        Security to add one before anything else
                                        opens up.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <dl className="divide-y rounded-lg border">
                                        <Credential
                                            label="Email"
                                            value="demo@keyring.test"
                                        />
                                        <Credential
                                            label="Password"
                                            value={demoAccounts.password}
                                        />
                                    </dl>
                                </CardContent>
                            </Card>

                            <Card>
                                <div className="flex items-start gap-4 px-6">
                                    <CardHeader className="flex-1 px-0">
                                        <CardTitle>
                                            With an authenticator app
                                        </CardTitle>
                                        <CardDescription>
                                            Scan the code with any authenticator
                                            app, or type the secret in. A code
                                            only works during its own 30
                                            seconds.
                                        </CardDescription>
                                    </CardHeader>
                                    <div
                                        className="size-24 shrink-0 rounded-md bg-white p-1.5 [&_svg]:size-full"
                                        role="img"
                                        aria-label="QR code for the authenticator app secret"
                                        // Made on the server from the seeded secret.
                                        dangerouslySetInnerHTML={{
                                            __html: demoAccounts.totpQr,
                                        }}
                                    />
                                </div>
                                <CardContent>
                                    <dl className="divide-y rounded-lg border">
                                        <Credential
                                            label="Email"
                                            value="2fa@keyring.test"
                                        />
                                        <Credential
                                            label="Secret"
                                            value={demoAccounts.totpSecret}
                                            // In fours, as authenticator apps
                                            // show it, and four to a line, so
                                            // no group is left on its own.
                                            // Copying takes it whole.
                                            shown={inFours(
                                                demoAccounts.totpSecret,
                                            )}
                                        />
                                        <Credential
                                            label="Recovery code"
                                            value={demoAccounts.recoveryCode}
                                        />
                                    </dl>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    <section aria-labelledby="try" className="space-y-4">
                        <h2
                            id="try"
                            className="text-xl font-semibold tracking-tight"
                        >
                            Things to try
                        </h2>

                        <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                            {tryThis.map(({ icon: Icon, title, text }) => (
                                <li key={title} className="flex gap-3">
                                    <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-medium">
                                            {title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {text}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                </main>
            </div>
        </>
    );
}

/**
 * A secret in groups of four, the way authenticator apps show one, with
 * four groups to a line.
 */
function inFours(secret: string): string {
    return (secret.match(/.{1,16}/g) ?? [secret])
        .map((line) => line.match(/.{1,4}/g)?.join(' ') ?? line)
        .join('\n');
}

/**
 * One line of a demo account, with a button to copy it. Long values wrap
 * at their spaces and hyphens, and only mid-word when a word can't fit.
 */
function Credential({
    label,
    value,
    shown = value,
}: {
    label: string;
    value: string;
    /** How it's shown, when that isn't how it's copied. */
    shown?: string;
}) {
    const [copied, copy] = useClipboard();

    return (
        <div className="flex items-center gap-3 py-1.5 pr-1.5 pl-3">
            <dt className="w-16 shrink-0 text-xs text-muted-foreground sm:w-20">
                {label}
            </dt>
            <dd className="flex min-w-0 flex-1 items-center gap-2">
                <span className="min-w-0 flex-1 font-mono text-[0.8125rem] wrap-anywhere whitespace-pre-line">
                    {shown}
                </span>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    aria-label={`Copy ${label.toLowerCase()}`}
                    onClick={() => void copy(value)}
                >
                    {copied === value ? <Check /> : <Copy />}
                </Button>
            </dd>
        </div>
    );
}
