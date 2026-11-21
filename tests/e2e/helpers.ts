import { execFileSync } from 'node:child_process';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';
import { baseURL, env, server } from './env';

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export interface TestUser {
    name: string;
    email: string;
    password: string;
    /** Set with twoFactor. */
    totpSecret: string;
    recoveryCodes: string[];
}

/**
 * A recovery code in the form Keyring makes them: 26 base32 characters, in
 * groups of four with the last two on their own. It refuses anything else.
 */
function recoveryCode(): string {
    return [...randomBytes(26)]
        .map((byte) => BASE32[byte % 32].toLowerCase())
        .join('')
        .replace(/(.{4})(?=.)/g, '$1-');
}

/** Run PHP in the test app, as `php artisan tinker` would, and read what it prints. */
function php(code: string): string {
    return execFileSync('php', ['artisan', 'tinker', '--execute', code], {
        env: { ...process.env, ...env },
        encoding: 'utf8',
    });
}

/**
 * A new user in the test database, so tests don't share codes or lockouts.
 * They're made by the factory, so their address is verified: an account
 * that isn't can't sign in at all. Everyone needs a second factor here, so
 * without twoFactor signing in lands on Settings → Security, which asks for
 * one. With it, they have an authenticator app and recovery codes.
 */
export function createUser({
    twoFactor = false,
    password = 'password',
} = {}): TestUser {
    const id = randomUUID();
    const user: TestUser = {
        name: `E2E ${id.slice(0, 8)}`,
        email: `e2e-${id}@keyring.test`,
        password,
        totpSecret: [...randomBytes(32)]
            .map((byte) => BASE32[byte % 32])
            .join(''),
        recoveryCodes: [recoveryCode(), recoveryCode()],
    };

    let create = `$user = App\\Models\\User::factory()->create(['name' => '${user.name}', 'email' => '${user.email}', 'password' => ${JSON.stringify(password)}]);`;

    if (twoFactor) {
        create +=
            `Keyring\\Models\\Authenticator::factory()->totp('${user.totpSecret}')->default()->for($user, 'authenticatable')->create();` +
            `Keyring\\Models\\Authenticator::factory()->recoveryCodes(${JSON.stringify(user.recoveryCodes)})->for($user, 'authenticatable')->create();`;
    }

    php(create);

    return user;
}

/**
 * Hold the user until they choose a new password, as an administrator or a
 * risk response would (Keyring::requirePasswordChange()).
 */
export function requirePasswordChange(user: TestUser): void {
    php(
        `Keyring\\Facades\\Keyring::requirePasswordChange(App\\Models\\User::where('email', '${user.email}')->sole(), 'Asked for by a browser test.');`,
    );
}

const LOG = 'storage/logs/laravel.log';

/**
 * Where the app's log ends now. The test app "sends" its mail by writing it
 * there (MAIL_MAILER=log), so this marks the moment before an email.
 */
export function mailSentSoFar(): number {
    return existsSync(LOG) ? statSync(LOG).size : 0;
}

function mailSince(mark: number): string {
    return existsSync(LOG)
        ? readFileSync(LOG).subarray(mark).toString('utf8')
        : '';
}

/**
 * Every different link matching the pattern in the mail sent since the mark,
 * in the order they were sent. Some emails go out after the response, so
 * this waits until there are as many as expected.
 */
export async function emailedLinks(
    pattern: RegExp,
    since: number,
    count = 1,
): Promise<string[]> {
    let links: string[] = [];

    await expect(async () => {
        const found = mailSince(since).match(new RegExp(pattern.source, 'g'));

        // Each is in the email twice, as HTML and as plain text.
        links = [
            ...new Set(
                (found ?? []).map((link) => link.replaceAll('&amp;', '&')),
            ),
        ];

        expect(links.length).toBeGreaterThanOrEqual(count);
    }).toPass({ timeout: 10_000 });

    return links;
}

/** The newest link matching the pattern in the mail sent since the mark. */
export async function emailedLink(
    pattern: RegExp,
    since: number,
): Promise<string> {
    return (await emailedLinks(pattern, since)).pop()!;
}

/** The newest eight digit code emailed since the mark, as it was shown. */
export async function emailedCode(since: number): Promise<string> {
    let code = '';

    await expect(() => {
        const found = mailSince(since).match(/\b\d{4} \d{4}\b/g);

        expect(found).not.toBeNull();
        code = found![found!.length - 1];
    }).toPass({ timeout: 10_000 });

    return code;
}

/** Wait for an email saying this to have been sent since the mark. */
export async function expectEmailed(
    text: string,
    since: number,
): Promise<void> {
    await expect(() => {
        expect(mailSince(since)).toContain(text);
    }).toPass({ timeout: 10_000 });
}

/**
 * Start the rate limits over. Keyring allows six requests a minute to its
 * form routes and emailed links from one address, and every test here comes
 * from the same one, where real visitors wouldn't.
 */
export function forgetRateLimits(): void {
    execFileSync('php', ['artisan', 'cache:clear'], {
        env: { ...process.env, ...env },
        stdio: 'ignore',
    });
}

const ENV_FILE = '.env.e2e';
const SETTINGS = '# Set by a test, until it calls configureApp() again:';

/**
 * Run the app with extra settings from here on, as more lines in .env.e2e,
 * or with none to put it back as serve.sh wrote it. PHP's own server reads
 * the file on every request. Octane's workers only read it when they start,
 * so they are reloaded, as a deploy would. Call it while the page is idle: a
 * request that arrives in the middle of a reload can be left waiting.
 */
export async function configureApp(
    settings: Record<string, string> = {},
): Promise<void> {
    const [original] = readFileSync(ENV_FILE, 'utf8').split(SETTINGS);
    const lines = Object.entries(settings).map(
        ([name, value]) => `${name}="${value}"`,
    );

    writeFileSync(
        ENV_FILE,
        lines.length
            ? `${original}${SETTINGS}\n${lines.join('\n')}\n`
            : original,
    );

    if (server === 'octane') {
        execFileSync(
            'php',
            ['artisan', 'octane:reload', '--server=frankenphp'],
            { env: { ...process.env, ...env }, stdio: 'ignore' },
        );
    }

    await expect(async () => {
        const response = await fetch(`${baseURL}/login`, {
            signal: AbortSignal.timeout(2_000),
        });

        expect(response.status).toBe(200);
    }).toPass({ timeout: 20_000 });
}

/**
 * The user's sign-in methods as the database has them, with what Keyring
 * kept about each one's attestation.
 */
export function authenticators(
    user: TestUser,
): { factor: string; attestation: string | null; aaguid: string | null }[] {
    return JSON.parse(
        php(
            `echo Keyring\\Models\\Authenticator::query()->ownedBy(App\\Models\\User::where('email', '${user.email}')->sole())` +
                `->oldest()->get()->map->only(['factor', 'attestation', 'aaguid'])->toJson();`,
        ),
    );
}

/**
 * Chrome's virtual authenticator: it answers WebAuthn prompts as if the user
 * touched their key and passed its PIN or biometric. "platform" is a passkey
 * built into the device, "usb" is a security key and "u2f" is an older
 * security key, from before FIDO2. Call answer(false) to leave prompts
 * waiting, as if the user hadn't touched anything yet, and remove() to
 * unplug it.
 */
export async function addVirtualAuthenticator(
    page: Page,
    kind: 'platform' | 'usb' | 'u2f' = 'platform',
): Promise<{
    answer: (enabled: boolean) => Promise<void>;
    remove: () => Promise<void>;
}> {
    const cdp = await page.context().newCDPSession(page);

    await cdp.send('WebAuthn.enable');
    const { authenticatorId } = await cdp.send(
        'WebAuthn.addVirtualAuthenticator',
        {
            options: {
                protocol: kind === 'u2f' ? 'u2f' : 'ctap2',
                transport: kind === 'platform' ? 'internal' : 'usb',
                hasResidentKey: kind !== 'u2f',
                hasUserVerification: kind !== 'u2f',
                isUserVerified: true,
                automaticPresenceSimulation: true,
            },
        },
    );

    return {
        answer: async (enabled) => {
            await cdp.send('WebAuthn.setAutomaticPresenceSimulation', {
                authenticatorId,
                enabled,
            });
        },
        remove: async () => {
            await cdp.send('WebAuthn.removeVirtualAuthenticator', {
                authenticatorId,
            });
        },
    };
}

export async function signInWithPassword(
    page: Page,
    email: string,
    password: string,
): Promise<void> {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Log in' }).click();
}

/**
 * Sign in with the password, then the authenticator app's code.
 */
export async function signInWithTwoFactors(
    page: Page,
    user: TestUser,
): Promise<void> {
    await signInWithPassword(page, user.email, user.password);
    await page
        .getByLabel('Code from your authenticator app')
        .fill(await currentTotp(user.totpSecret));
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
}

/**
 * Where someone with only a password lands after signing in: the page for
 * adding a second factor, saying why. Every other page sends them back here.
 */
export async function expectAskedForSecondFactor(page: Page): Promise<void> {
    await expect(page).toHaveURL(/\/settings\/security/);
    await expect(
        page.getByText('Add a second factor to carry on'),
    ).toBeVisible();
}

/** Forget the session, as if the browser was closed. Keeps the authenticator. */
export async function signOut(page: Page): Promise<void> {
    await page.context().clearCookies();
}

/**
 * Add a passkey or security key from Settings → Security. Pass the path a
 * user sent here to add their first method was going to, which they carry
 * on to once the codes are saved.
 */
export async function addKey(
    page: Page,
    label: 'Passkey' | 'Security key',
    continueTo?: string,
): Promise<void> {
    await page.goto('/settings/security');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByRole('menuitem', { name: label }).click();
    await saveRecoveryCodes(page, continueTo);
}

/**
 * Close the recovery codes a first passkey or security key comes with.
 * Adding the key counts as using it, so with the password the session
 * signed in with there's nothing more to confirm before the page reloads.
 * A user `keyring.enrolled` sent to add it carries on to `continueTo`, the
 * page they were going to, instead.
 */
export async function saveRecoveryCodes(
    page: Page,
    continueTo?: string,
): Promise<void> {
    await expect(
        page.getByRole('heading', { name: 'Save your recovery codes' }),
    ).toBeVisible();

    if (continueTo) {
        await page
            .getByRole('button', { name: 'I’ve saved these, continue' })
            .click();
        await expect(page).toHaveURL(new URL(continueTo, page.url()).href);

        return;
    }

    await page.getByRole('button', { name: 'I’ve saved these' }).click();

    // Wait until it's all done.
    await expect(page).toHaveURL(/\/settings\/security/);
    await expect(
        page.getByText('Recovery codes', { exact: true }),
    ).toBeVisible();
}

/**
 * The code an authenticator app shows for the secret, once there is time to
 * type it: the app only takes a code during its own 30 seconds (a window of
 * 0, as OWASP ASVS 6.5.5 asks), so one read at the very end of them would be
 * refused by the time it arrived.
 */
export async function currentTotp(secret: string): Promise<string> {
    const left = 30_000 - (Date.now() % 30_000);

    if (left < 3_000) {
        await new Promise((resolve) => setTimeout(resolve, left + 100));
    }

    return totp(secret);
}

/** The code an authenticator app would show for the secret at a moment. */
export function totp(secret: string, at = Date.now()): string {
    const bits = secret
        .replace(/=+$/, '')
        .split('')
        .map((char) => BASE32.indexOf(char).toString(2).padStart(5, '0'))
        .join('');
    const key = Buffer.from(
        bits.match(/.{8}/g)!.map((byte) => parseInt(byte, 2)),
    );

    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(Math.floor(at / 30_000)));

    const hmac = createHmac('sha1', key).update(counter).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;

    return code.toString().padStart(6, '0');
}
