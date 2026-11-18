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
import AppLogoMark from '@/components/app-logo-mark';
import RowIcon from '@/components/keyring/row-icon';
import { Button } from '@/components/ui/button';
import { InsetCard, InsetCardBody } from '@/components/ui/inset-card';
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

            <div className="min-h-svh bg-ground text-foreground">
                <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
                    <Link
                        href="/"
                        className="flex items-center gap-2.5 rounded-lg text-[15px] font-medium outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    >
                        <AppLogoMark />
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

                <main className="mx-auto w-full max-w-5xl space-y-12 px-4 pt-4 pb-16 sm:px-6 lg:pt-8">
                    <section className="overflow-hidden rounded-2xl bg-card bg-wash shadow-card">
                        <div className="max-w-2xl space-y-5 px-6 py-10 sm:px-10 sm:py-14">
                            <h1 className="text-3xl font-medium tracking-[-0.02em] sm:text-[2.75rem] sm:leading-[1.1]">
                                Keyring, in a real app
                            </h1>
                            <p className="text-base text-muted-foreground sm:text-lg">
                                This is Laravel’s React starter kit with Fortify
                                taken out and Keyring put in. Sign in with one
                                of the demo accounts below, or register your
                                own, and try passkeys, second factors, step-up,
                                devices and sessions, risk signals and the
                                security log.
                            </p>
                            <div className="flex flex-wrap gap-3 pt-1">
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
                                    <a
                                        href={docs}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
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
                        </div>
                    </section>

                    <section aria-labelledby="accounts" className="space-y-4">
                        <div className="space-y-1">
                            <h2
                                id="accounts"
                                className="text-xl font-medium tracking-tight"
                            >
                                Demo accounts
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Both use the password{' '}
                                <code className="rounded bg-muted px-1 font-mono text-foreground">
                                    {demoAccounts.password}
                                </code>
                                . To put them back the way they started, run{' '}
                                <code className="rounded bg-muted px-1 font-mono text-foreground">
                                    php artisan example:reset
                                </code>
                                .
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 md:items-start">
                            <InsetCard>
                                <div className="px-3 pt-2.5 pb-2">
                                    <h3 className="text-sm font-medium">
                                        Password only
                                    </h3>
                                    <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">
                                        Everyone needs a second factor here, so
                                        signing in takes you to Settings →
                                        Security to add one before anything else
                                        opens up.
                                    </p>
                                </div>
                                <InsetCardBody>
                                    <dl className="divide-y divide-border/70">
                                        <Credential
                                            label="Email"
                                            value="demo@keyring.test"
                                        />
                                        <Credential
                                            label="Password"
                                            value={demoAccounts.password}
                                        />
                                    </dl>
                                </InsetCardBody>
                            </InsetCard>

                            <InsetCard>
                                <div className="flex items-start gap-4 px-3 pt-2.5 pb-2">
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium">
                                            With an authenticator app
                                        </h3>
                                        <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">
                                            Scan the code with any authenticator
                                            app, or type the secret in. A code
                                            only works during its own 30
                                            seconds.
                                        </p>
                                    </div>
                                    <div
                                        className="size-20 shrink-0 rounded-md bg-white p-1.5 shadow-raised [&_svg]:size-full"
                                        role="img"
                                        aria-label="QR code for the authenticator app secret"
                                        // Made on the server from the seeded secret.
                                        dangerouslySetInnerHTML={{
                                            __html: demoAccounts.totpQr,
                                        }}
                                    />
                                </div>
                                <InsetCardBody>
                                    <dl className="divide-y divide-border/70">
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
                                </InsetCardBody>
                            </InsetCard>
                        </div>
                    </section>

                    <section aria-labelledby="try" className="space-y-5">
                        <h2
                            id="try"
                            className="text-xl font-medium tracking-tight"
                        >
                            Things to try
                        </h2>

                        <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                            {tryThis.map(({ icon, title, text }) => (
                                <li key={title} className="flex gap-3">
                                    <RowIcon icon={icon} />
                                    <div className="space-y-1 pt-1">
                                        <h3 className="text-sm font-medium">
                                            {title}
                                        </h3>
                                        <p className="text-[13px] leading-5 text-muted-foreground">
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
        <div className="flex items-center gap-3 py-1.5 pr-1.5 pl-4">
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
