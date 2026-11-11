import { X509Certificate } from 'node:crypto';
import {
    existsSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import {
    addVirtualAuthenticator,
    authenticators,
    configureApp,
    createUser,
    expectAskedForSecondFactor,
    saveRecoveryCodes,
    signInWithPassword,
    signOut,
} from './helpers';

/**
 * Security keys that have to prove who made them: the app runs with
 * SECURITY_KEY_ATTESTATION set, as one that calls requireAttestation() would,
 * and Chrome's virtual authenticator plays the key.
 *
 * Chrome signs every virtual key's attestation with one key of its own, under
 * a certificate it makes afresh for each registration. So "the maker's root"
 * here is one of those certificates, read from a registration these tests
 * make themselves before the app is asked anything. The other maker is a
 * real one: Yubico's root, which never signed a virtual key.
 */
type Attestation = {
    format: string;
    aaguid: string;
    /** PEM encoded, the key's own first. */
    certificates: string[];
};

const NO_AAGUID = '00000000-0000-0000-0000-000000000000';
const ANOTHER_MODEL = '2fc0579f-8113-47ea-b116-bb5a8db9202a';
const yubico = resolve('tests/e2e/fixtures/yubico-u2f-root-ca.pem');

let directory: string;
let chromium: { root: string; aaguid: string };

// Learn Chrome's certificate and AAGUID from a registration of our own.
test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const key = await register(page, 'usb');
    await page.close();

    directory = mkdtempSync(join(tmpdir(), 'keyring-e2e-'));
    chromium = {
        root: join(directory, 'chromium-virtual-authenticator.pem'),
        aaguid: key.aaguid,
    };
    writeFileSync(chromium.root, key.certificates[0]);
});

test.afterAll(async () => {
    await configureApp();
    rmSync(directory, { recursive: true });
});

/** Run the app as one that only takes security keys these roots vouch for. */
async function requireAttestation(
    roots: string,
    models: string[] = [],
): Promise<void> {
    await configureApp({
        SECURITY_KEY_ATTESTATION: 'true',
        KEYRING_ATTESTATION_ROOTS: roots,
        SECURITY_KEY_MODELS: models.join(','),
    });
}

/**
 * Register with a new virtual key the way a page would, asking for "direct"
 * attestation, and read what the browser hands back. Keyring isn't involved.
 */
async function register(page: Page, kind: 'usb' | 'u2f'): Promise<Attestation> {
    await page.goto('/robots.txt');
    const key = await addVirtualAuthenticator(page, kind);

    const attestationObject = await page.evaluate(async () => {
        const credential = (await navigator.credentials.create({
            publicKey: {
                rp: { name: 'Keyring Example', id: 'localhost' },
                user: {
                    id: crypto.getRandomValues(new Uint8Array(16)),
                    name: 'someone@keyring.test',
                    displayName: 'Someone',
                },
                challenge: crypto.getRandomValues(new Uint8Array(32)),
                pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
                attestation: 'direct',
            },
        })) as PublicKeyCredential;

        return credential.toJSON().response.attestationObject as string;
    });

    await key.remove();

    return readAttestation(attestationObject);
}

/** What an attestation object says, without checking any of it. */
function readAttestation(attestationObject: string): Attestation {
    const { fmt, attStmt, authData } = decodeCbor(
        Buffer.from(attestationObject, 'base64url'),
    ).value;

    // The AAGUID follows the RP ID hash, the flags and the counter.
    const aaguid = (authData as Buffer).subarray(37, 53).toString('hex');

    return {
        format: fmt,
        aaguid: aaguid.replace(/^(.{8})(.{4})(.{4})(.{4})/, '$1-$2-$3-$4-'),
        certificates: ((attStmt.x5c ?? []) as Buffer[]).map((der) =>
            new X509Certificate(der).toString(),
        ),
    };
}

/** Just enough CBOR for an attestation object: maps, arrays, strings, ints. */
function decodeCbor(bytes: Buffer, at = 0): { value: any; next: number } {
    const type = bytes[at] >> 5;
    const short = bytes[at] & 31;
    const size = short < 24 ? 0 : 2 ** (short - 24);
    const length = size ? bytes.readUIntBE(at + 1, size) : short;
    let next = at + 1 + size;

    const item = () => {
        const decoded = decodeCbor(bytes, next);
        next = decoded.next;

        return decoded.value;
    };

    switch (type) {
        case 0:
            return { value: length, next };
        case 1:
            return { value: -1 - length, next };
        case 2:
            return {
                value: bytes.subarray(next, next + length),
                next: next + length,
            };
        case 3:
            return {
                value: bytes.toString('utf8', next, next + length),
                next: next + length,
            };
        case 4:
            return { value: Array.from({ length }, item), next };
        case 5:
            return {
                value: Object.fromEntries(
                    Array.from({ length }, () => [item(), item()]),
                ),
                next,
            };
        default:
            throw new Error(`Unexpected CBOR type ${type}.`);
    }
}

/**
 * Add a passkey or security key from Settings → Security, as far as the
 * app's answer: what Keyring asked the browser for, what the page sent back,
 * the status Keyring answered with and how many errors it reported.
 */
async function add(page: Page, label: 'Passkey' | 'Security key') {
    const url = `/user/authenticators/${label === 'Passkey' ? 'passkey' : 'security-key'}`;

    await page.goto('/settings/security');

    const reported = reportedErrors();
    const [begun, confirmed] = await Promise.all([
        page.waitForResponse((response) => response.url().endsWith(url)),
        page.waitForResponse((response) =>
            response.url().endsWith(`${url}/confirm`),
        ),
        page
            .getByRole('button', { name: 'Add', exact: true })
            .click()
            .then(() => page.getByRole('menuitem', { name: label }).click()),
    ]);

    return {
        reported: reportedErrors() - reported,
        asked: (await begun.json()).enrollment.options.attestation as string,
        sent: readAttestation(
            confirmed.request().postDataJSON().credential.response
                .attestationObject,
        ),
        status: confirmed.status(),
    };
}

/**
 * How many errors the app has reported. Keyring turns an untrusted key away
 * quietly, but reports a root it can't read, which refuses every key and
 * would look the same from the page.
 */
function reportedErrors(): number {
    const log = 'storage/logs/laravel.log';

    return existsSync(log)
        ? (readFileSync(log, 'utf8').match(/^\[[^\]]+\] e2e\.ERROR/gm) ?? [])
              .length
        : 0;
}

async function signIn(page: Page) {
    const user = createUser();

    // With only a password, that's the page for adding a second factor.
    await signInWithPassword(page, user.email, user.password);
    await expectAskedForSecondFactor(page);

    return user;
}

function securityKeys(page: Page) {
    return page
        .getByRole('listitem')
        .filter({ hasText: /Security key · last used/ });
}

/** The app turned the key away: it says so, and has added nothing. */
async function expectRefused(
    page: Page,
    attempt: Awaited<ReturnType<typeof add>>,
    user: ReturnType<typeof createUser>,
): Promise<void> {
    expect(attempt.status).toBe(422);
    expect(attempt.reported).toBe(0);
    await expect(
        page.getByText(
            "This key couldn't be added. Only certain security keys are accepted here, and this doesn't appear to be one of them.",
        ),
    ).toBeVisible();

    // No recovery codes, the button is ready for another go, and the key is
    // neither on the page nor in the database.
    await expect(
        page.getByRole('heading', { name: 'Save your recovery codes' }),
    ).toBeHidden();
    await expect(
        page.getByRole('button', { name: 'Add', exact: true }),
    ).toBeEnabled();

    await page.reload();
    await expect(page.getByText('Sign-in methods')).toBeVisible();
    await expect(securityKeys(page)).toHaveCount(0);
    expect(authenticators(user)).toEqual([]);
}

test('a virtual key attests under a new certificate each time, signed with one key', async ({
    page,
}) => {
    const first = await register(page, 'usb');
    const second = await register(page, 'usb');
    const older = await register(page, 'u2f');

    expect(first.format).toBe('packed');
    expect(older.format).toBe('fido-u2f');
    expect(first.aaguid).not.toBe(NO_AAGUID);
    expect(second.aaguid).toBe(first.aaguid);
    expect(older.aaguid).toBe(NO_AAGUID);

    const certificates = [first, second, older].map((key) => {
        expect(key.certificates).toHaveLength(1);

        return new X509Certificate(key.certificates[0]);
    });

    // Each signed its own certificate, so there is no chain above it...
    for (const certificate of certificates) {
        expect(certificate.verify(certificate.publicKey)).toBe(true);
    }

    // ...yet any of them vouches for the others: same name, same key.
    expect(new Set(certificates.map((c) => c.fingerprint256)).size).toBe(3);
    expect(certificates[1].verify(certificates[0].publicKey)).toBe(true);
    expect(certificates[2].verify(certificates[0].publicKey)).toBe(true);
    expect(certificates[1].issuer).toBe(certificates[0].subject);
});

test('adds a security key whose attestation chains to a root the app trusts, and signs in with it', async ({
    page,
}) => {
    await requireAttestation(chromium.root);
    await addVirtualAuthenticator(page, 'usb');
    const user = await signIn(page);

    const attempt = await add(page, 'Security key');

    // Keyring asked for the maker's word, and the key sent a certificate
    // that is not the one the app trusts, only signed by the same maker.
    expect(attempt.asked).toBe('direct');
    expect(attempt.sent.format).toBe('packed');
    expect(attempt.sent.certificates).toHaveLength(1);
    const trusted = readFileSync(chromium.root, 'utf8');
    expect(attempt.sent.certificates[0]).not.toBe(trusted);
    expect(
        new X509Certificate(attempt.sent.certificates[0]).verify(
            new X509Certificate(trusted).publicKey,
        ),
    ).toBe(true);
    expect(attempt.status).toBe(200);

    await saveRecoveryCodes(page);
    await expect(securityKeys(page)).toHaveCount(1);
    expect(authenticators(user)).toContainEqual({
        factor: 'security-key',
        attestation: 'basic',
        aaguid: chromium.aaguid,
    });

    // The challenge page prompts for the key on its own.
    await signOut(page);
    await signInWithPassword(page, user.email, user.password);
    await expect(page).toHaveURL(/\/dashboard/);
});

test('adds an attested key in a browser without the newer json helpers', async ({
    page,
}) => {
    // Older browsers have no toJSON() or parseCreationOptionsFromJSON(), so
    // Keyring's helper converts the options and the larger response itself.
    await page.addInitScript(() => {
        delete (PublicKeyCredential as any).parseCreationOptionsFromJSON;
        delete (PublicKeyCredential as any).parseRequestOptionsFromJSON;
        delete (PublicKeyCredential.prototype as any).toJSON;
    });

    await requireAttestation(chromium.root);
    await addVirtualAuthenticator(page, 'usb');
    const user = await signIn(page);

    expect(
        await page.evaluate(
            () =>
                'toJSON' in PublicKeyCredential.prototype ||
                'parseCreationOptionsFromJSON' in PublicKeyCredential,
        ),
    ).toBe(false);

    const attempt = await add(page, 'Security key');

    expect(attempt.sent.format).toBe('packed');
    expect(attempt.sent.certificates).toHaveLength(1);
    expect(attempt.status).toBe(200);

    await saveRecoveryCodes(page);
    expect(authenticators(user)).toContainEqual({
        factor: 'security-key',
        attestation: 'basic',
        aaguid: chromium.aaguid,
    });

    await signOut(page);
    await signInWithPassword(page, user.email, user.password);
    await expect(page).toHaveURL(/\/dashboard/);
});

test('adds an older u2f key the same way', async ({ page }) => {
    await requireAttestation(chromium.root);
    await addVirtualAuthenticator(page, 'u2f');
    const user = await signIn(page);

    const attempt = await add(page, 'Security key');

    expect(attempt.asked).toBe('direct');
    expect(attempt.sent.format).toBe('fido-u2f');
    expect(attempt.status).toBe(200);

    // The key can't check who is holding it, and doesn't need to: the
    // session proved the password when it signed in, and adding the key
    // counts as using it.
    await saveRecoveryCodes(page);
    await expect(securityKeys(page)).toHaveCount(1);
    expect(authenticators(user)).toContainEqual({
        factor: 'security-key',
        attestation: 'basic',
        aaguid: NO_AAGUID,
    });
});

test('refuses the same key when the app only trusts another maker', async ({
    page,
}) => {
    await requireAttestation(yubico);
    await addVirtualAuthenticator(page, 'usb');
    const user = await signIn(page);

    const attempt = await add(page, 'Security key');

    expect(attempt.asked).toBe('direct');
    expect(attempt.sent.format).toBe('packed');
    expect(attempt.sent.certificates).toHaveLength(1);
    await expectRefused(page, attempt, user);
});

test('refuses a key when the browser hands over no attestation', async ({
    page,
}) => {
    await requireAttestation(chromium.root);
    await addVirtualAuthenticator(page, 'usb');
    const user = await signIn(page);

    // What a browser does when the person says no to sharing their key's
    // make and model: it answers as if "none" had been asked for.
    await page.route('**/user/authenticators/security-key', async (route) => {
        const response = await route.fetch();
        const body = await response.json();

        expect(body.enrollment.options.attestation).toBe('direct');
        body.enrollment.options.attestation = 'none';

        await route.fulfill({ response, json: body });
    });

    const attempt = await add(page, 'Security key');

    expect(attempt.sent.format).toBe('none');
    expect(attempt.sent.certificates).toHaveLength(0);
    await expectRefused(page, attempt, user);
});

test('adds a model that is on the list', async ({ page }) => {
    await requireAttestation(chromium.root, [ANOTHER_MODEL, chromium.aaguid]);
    await addVirtualAuthenticator(page, 'usb');
    const user = await signIn(page);

    const attempt = await add(page, 'Security key');

    expect(attempt.sent.aaguid).toBe(chromium.aaguid);
    expect(attempt.status).toBe(200);

    await saveRecoveryCodes(page);
    await expect(securityKeys(page)).toHaveCount(1);
    expect(authenticators(user)).toContainEqual({
        factor: 'security-key',
        attestation: 'basic',
        aaguid: chromium.aaguid,
    });
});

test('refuses a model that is not on the list, though the app trusts its maker', async ({
    page,
}) => {
    await requireAttestation(chromium.root, [ANOTHER_MODEL]);
    await addVirtualAuthenticator(page, 'usb');
    const user = await signIn(page);

    const attempt = await add(page, 'Security key');

    expect(attempt.sent.aaguid).toBe(chromium.aaguid);
    await expectRefused(page, attempt, user);
});

test('refuses a u2f key once there is a list, since it has no model to be on it', async ({
    page,
}) => {
    await requireAttestation(chromium.root, [chromium.aaguid]);
    await addVirtualAuthenticator(page, 'u2f');
    const user = await signIn(page);

    const attempt = await add(page, 'Security key');

    expect(attempt.sent.aaguid).toBe(NO_AAGUID);
    await expectRefused(page, attempt, user);
});

test('still adds a passkey, and signs in with it, while security keys need attestation', async ({
    page,
}) => {
    // Under a root that vouches for no virtual key, so it is not attestation
    // that lets the passkey in.
    await requireAttestation(yubico);
    await addVirtualAuthenticator(page);
    const user = await signIn(page);

    const attempt = await add(page, 'Passkey');

    expect(attempt.asked).toBe('none');
    expect(attempt.sent.format).toBe('none');
    expect(attempt.status).toBe(200);

    await saveRecoveryCodes(page);
    expect(authenticators(user)).toContainEqual(
        expect.objectContaining({ factor: 'passkey', attestation: null }),
    );

    // The login page offers the passkey as soon as it loads.
    await signOut(page);
    await page.goto('/login');
    await expect(page).toHaveURL(/\/dashboard/);
});

test('asks for no attestation once the settings are gone, as the demo ships', async ({
    page,
}) => {
    await configureApp();
    await addVirtualAuthenticator(page, 'usb');
    const user = await signIn(page);

    const attempt = await add(page, 'Security key');

    expect(attempt.asked).toBe('none');
    expect(attempt.sent.format).toBe('none');
    expect(attempt.status).toBe(200);

    await saveRecoveryCodes(page);
    expect(authenticators(user)).toContainEqual(
        expect.objectContaining({ factor: 'security-key', attestation: null }),
    );
});
