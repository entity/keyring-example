import { randomUUID } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import {
    configureApp,
    createUser,
    emailedLink,
    expectAskedForSecondFactor,
    expectEmailed,
    forgetRateLimits,
    mailSentSoFar,
    signInWithPassword,
} from './helpers';

const password = 'a passphrase long enough alone';
const received =
    "Thanks for registering. We've emailed that address with what to do next.";
// In Laravel's own email, where the text part writes links as [url](url).
const verificationLink =
    /http:\/\/localhost:\d+\/email\/verify\/\d+\/\w+\?expires=\d+&(?:amp;)?signature=\w+/;

async function register(page: Page, email: string): Promise<void> {
    await page.goto('/register');
    await page.getByLabel('Name').fill('New Person');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm password').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();
}

function newAddress(): string {
    return `e2e-${randomUUID()}@keyring.test`;
}

test.beforeEach(() => forgetRateLimits());

test('registering signs nobody in, and the emailed link and the password verify the address', async ({
    page,
}) => {
    const email = newAddress();
    const mail = mailSentSoFar();

    await register(page, email);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText(received)).toBeVisible();

    // The password alone gets nowhere until the address is verified.
    await signInWithPassword(page, email, password);
    await expect(
        page.getByText('These credentials do not match our records.'),
    ).toBeVisible();

    // Opening the link verifies nothing by itself. It lets this browser sign
    // in, and signing in is what verifies the address.
    await page.goto(await emailedLink(verificationLink, mail));
    await expect(page).toHaveURL(/\/login$/);
    await expect(
        page.getByText('Sign in to finish verifying your email address.'),
    ).toBeVisible();

    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Log in' }).click();

    // In, and like everyone else sent to add a second factor first.
    await expectAskedForSecondFactor(page);

    // From now on the password works from any browser.
    await page.context().clearCookies();
    await signInWithPassword(page, email, password);
    await expectAskedForSecondFactor(page);
});

test('registering with an address that has an account looks the same, and emails its owner', async ({
    page,
}) => {
    const existing = createUser();
    const mail = mailSentSoFar();

    await register(page, existing.email);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText(received)).toBeVisible();

    // The owner hears about it, with a link to sign in. Nothing changed:
    // their own password still works, and the one just typed doesn't.
    await expectEmailed(
        'Someone tried to create an account with this email address.',
        mail,
    );

    await signInWithPassword(page, existing.email, password);
    await expect(
        page.getByText('These credentials do not match our records.'),
    ).toBeVisible();

    await signInWithPassword(page, existing.email, existing.password);
    await expectAskedForSecondFactor(page);
});

/**
 * The demo doesn't say when an address is taken. An app that does
 * (keyring.registration.reveal_taken) signs new users in straight away, and
 * they verify from inside: on the "check your inbox" page, and on the page
 * the emailed link opens, whose button is what verifies.
 */
test.describe('with registration that says when an address is taken', () => {
    test.beforeAll(async () => {
        await configureApp({ KEYRING_REVEAL_TAKEN: 'true' });
    });

    test.afterAll(async () => {
        await configureApp();
    });

    test('a new user is signed in, and verifies with the button on the page their link opens', async ({
        page,
    }) => {
        const email = newAddress();
        const mail = mailSentSoFar();

        await register(page, email);

        // Signed in, unverified: every page sends them to check their inbox.
        await expect(page).toHaveURL(/\/email\/verify$/);
        await expect(
            page.getByRole('button', { name: 'Resend verification email' }),
        ).toBeVisible();

        const link = await emailedLink(verificationLink, mail);
        await page.goto(link);

        // Opening the link changed nothing.
        await expect(
            page.getByText(`Press the button to confirm that ${email}`),
        ).toBeVisible();
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/email\/verify$/);

        // The button posts the link's signature in the body, to its path.
        await page.goto(link);
        const [posted] = await Promise.all([
            page.waitForRequest(
                (request) =>
                    request.method() === 'POST' &&
                    request.url().includes('/email/verify/'),
            ),
            page.getByRole('button', { name: 'Verify email address' }).click(),
        ]);

        expect(new URL(posted.url()).search).toBe('');
        expect(posted.postDataJSON()).toEqual({
            expires: new URL(link).searchParams.get('expires'),
            signature: new URL(link).searchParams.get('signature'),
        });

        // Verified, and on to what everyone needs next: a second factor.
        await expectAskedForSecondFactor(page);
    });

    test('a taken address is refused on the form', async ({ page }) => {
        const existing = createUser();

        await register(page, existing.email);

        await expect(page).toHaveURL(/\/register$/);
        await expect(
            page.getByText('The email has already been taken.'),
        ).toBeVisible();
    });
});
