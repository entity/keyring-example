import { expect, test } from '@playwright/test';
import {
    addKey,
    addVirtualAuthenticator,
    createUser,
    signInWithPassword,
    signOut,
    totp,
} from './helpers';

test('signs in with a password and an authenticator app', async ({ page }) => {
    const user = createUser({ twoFactor: true });
    await signInWithPassword(page, user.email, user.password);

    await expect(page).toHaveURL(/\/login\/challenge/);
    await page
        .getByLabel('Code from your authenticator app')
        .fill(totp(user.totpSecret));
    await page.getByRole('button', { name: 'Verify' }).click();

    await expect(page).toHaveURL(/\/dashboard/);
});

test('refuses a wrong authenticator code', async ({ page }) => {
    const user = createUser({ twoFactor: true });
    await signInWithPassword(page, user.email, user.password);

    await page.getByLabel('Code from your authenticator app').fill('000000');
    await page.getByRole('button', { name: 'Verify' }).click();

    await expect(page).toHaveURL(/\/login\/challenge/);
    await expect(
        page.getByText(/invalid|incorrect|didn.t work/i),
    ).toBeVisible();
});

test('signs in with a recovery code instead, once', async ({ page }) => {
    const user = createUser({ twoFactor: true });
    await signInWithPassword(page, user.email, user.password);
    await page.getByRole('button', { name: 'Try another way' }).click();
    await page.getByRole('button', { name: /Recovery codes/ }).click();

    await page.getByLabel('Recovery code').fill(user.recoveryCodes[0]);
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Each code works once.
    await signOut(page);
    await signInWithPassword(page, user.email, user.password);
    await page.getByRole('button', { name: 'Try another way' }).click();
    await page.getByRole('button', { name: /Recovery codes/ }).click();
    await page.getByLabel('Recovery code').fill(user.recoveryCodes[0]);
    await page.getByRole('button', { name: 'Verify' }).click();

    await expect(page).toHaveURL(/\/login\/challenge/);
});

test("signs in with a passkey from the email field's autofill", async ({
    page,
}) => {
    await addVirtualAuthenticator(page);
    const user = createUser();

    await signInWithPassword(page, user.email, user.password);
    await expect(page).toHaveURL(/\/dashboard/);
    await addKey(page, 'Passkey');

    // The login page asks the browser for passkeys as soon as it loads, and
    // the virtual authenticator offers one straight away.
    await signOut(page);
    await page.goto('/login');

    await expect(page).toHaveURL(/\/dashboard/);
});

test('signs in with the passkey button while autofill is waiting', async ({
    page,
}) => {
    const authenticator = await addVirtualAuthenticator(page);
    const user = createUser();

    await signInWithPassword(page, user.email, user.password);
    await expect(page).toHaveURL(/\/dashboard/);
    await addKey(page, 'Passkey');

    // Nothing answers yet, so autofill's request stays open until the button
    // replaces it. Then the key answers the button's request.
    await authenticator.answer(false);
    await signOut(page);
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in with a passkey' }).click();
    await authenticator.answer(true);

    await expect(page).toHaveURL(/\/dashboard/);
});

test('asks for the security key after the password', async ({ page }) => {
    await addVirtualAuthenticator(page, 'usb');
    const user = createUser();

    await signInWithPassword(page, user.email, user.password);
    await expect(page).toHaveURL(/\/dashboard/);
    await addKey(page, 'Security key');

    await signOut(page);
    await signInWithPassword(page, user.email, user.password);

    // The challenge page prompts for the key on its own.
    await expect(page).toHaveURL(/\/dashboard/);
});
