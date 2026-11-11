import { execFileSync } from 'node:child_process';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
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
 * A new user in the test database, so tests don't share codes or lockouts
 * (registering would call the breached-password API). With twoFactor, they
 * also have an authenticator app and recovery codes.
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
        recoveryCodes: [`${id.slice(0, 5)}-first`, `${id.slice(0, 5)}-other`],
    };

    let php = `$user = App\\Models\\User::factory()->create(['name' => '${user.name}', 'email' => '${user.email}', 'password' => ${JSON.stringify(password)}]);`;

    if (twoFactor) {
        php +=
            `Keyring\\Models\\Authenticator::factory()->totp('${user.totpSecret}')->default()->for($user, 'authenticatable')->create();` +
            `Keyring\\Models\\Authenticator::factory()->recoveryCodes(${JSON.stringify(user.recoveryCodes)})->for($user, 'authenticatable')->create();`;
    }

    execFileSync('php', ['artisan', 'tinker', '--execute', php], {
        env: { ...process.env, ...env },
        stdio: 'ignore',
    });

    return user;
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
    const php =
        `echo Keyring\\Models\\Authenticator::query()->ownedBy(App\\Models\\User::where('email', '${user.email}')->sole())` +
        `->oldest()->get()->map->only(['factor', 'attestation', 'aaguid'])->toJson();`;

    return JSON.parse(
        execFileSync('php', ['artisan', 'tinker', '--execute', php], {
            env: { ...process.env, ...env },
            encoding: 'utf8',
        }),
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

/** Forget the session, as if the browser was closed. Keeps the authenticator. */
export async function signOut(page: Page): Promise<void> {
    await page.context().clearCookies();
}

/** Add a passkey or security key from Settings → Security. */
export async function addKey(
    page: Page,
    label: 'Passkey' | 'Security key',
): Promise<void> {
    await page.goto('/settings/security');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByRole('menuitem', { name: label }).click();
    await saveRecoveryCodes(page);
}

/**
 * Close the recovery codes a first passkey or security key comes with. Give
 * the password for a key that can't check who is holding it (U2F).
 */
export async function saveRecoveryCodes(
    page: Page,
    password?: string,
): Promise<void> {
    await expect(
        page.getByRole('heading', { name: 'Save your recovery codes' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'I’ve saved these' }).click();

    // Saving them may first need a fresh verification with the new key,
    // which the confirm page asks for on its own. A key that only shows it
    // is there needs the password next to it.
    if (password !== undefined) {
        await page.getByLabel('Password', { exact: true }).fill(password);
        await page.getByRole('button', { name: 'Continue' }).click();
    }

    // Wait until it's all done.
    await expect(page).toHaveURL(/\/settings\/security/);
    await expect(
        page.getByText('Recovery codes', { exact: true }),
    ).toBeVisible();
}

/** The current code an authenticator app would show for the secret. */
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
