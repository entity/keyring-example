import { execFileSync } from 'node:child_process';
import { createHmac, randomUUID } from 'node:crypto';
import { expect, type Page } from '@playwright/test';
import { env } from './env';

export const TOTP_SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

/**
 * A new password-only user in the test database, so each test starts clean
 * (registering would call the breached-password API).
 */
export function createUser(): { email: string; password: string } {
    const email = `e2e-${randomUUID()}@keyring.test`;

    execFileSync(
        'php',
        [
            'artisan',
            'tinker',
            '--execute',
            `App\\Models\\User::factory()->create(['email' => '${email}']);`,
        ],
        { env: { ...process.env, ...env }, stdio: 'ignore' },
    );

    return { email, password: 'password' };
}

/**
 * Chrome's virtual authenticator: it answers WebAuthn prompts as if the user
 * touched their key and passed its PIN or biometric. "platform" is a passkey
 * built into the device; "usb" is a security key. Call answer(false) to leave
 * prompts waiting, as if the user hadn't touched anything yet.
 */
export async function addVirtualAuthenticator(
    page: Page,
    kind: 'platform' | 'usb' = 'platform',
): Promise<{ answer: (enabled: boolean) => Promise<void> }> {
    const cdp = await page.context().newCDPSession(page);

    await cdp.send('WebAuthn.enable');
    const { authenticatorId } = await cdp.send(
        'WebAuthn.addVirtualAuthenticator',
        {
            options: {
                protocol: 'ctap2',
                transport: kind === 'platform' ? 'internal' : 'usb',
                hasResidentKey: true,
                hasUserVerification: true,
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
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('menuitem', { name: label }).click();

    // The first extra sign-in method comes with recovery codes.
    await expect(
        page.getByRole('heading', { name: 'Save your recovery codes' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'I’ve saved these' }).click();

    // Saving them may first need a fresh verification with the new key,
    // which the confirm page asks for on its own. Wait until it's all done.
    await expect(page).toHaveURL(/\/settings\/security/);
    await expect(
        page.getByText('Recovery codes', { exact: true }),
    ).toBeVisible();
}

/** The current code an authenticator app would show for the secret. */
export function totp(secret: string, at = Date.now()): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const bits = secret
        .replace(/=+$/, '')
        .split('')
        .map((char) => alphabet.indexOf(char).toString(2).padStart(5, '0'))
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
