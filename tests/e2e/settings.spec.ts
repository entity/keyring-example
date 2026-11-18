import { expect, type Page, test } from '@playwright/test';
import { createUser, signInWithTwoFactors, type TestUser } from './helpers';

/**
 * Sign in and reach Settings the way a person does: one full page load (the
 * login page), then only in-app links. The browser keeps the login page's
 * referrer policy for all of them, so these cover Keyring's choice of policy:
 * the app still gets a Referer, and a failed form comes back to its own page
 * instead of landing on the dashboard by way of /login.
 */
async function signInAndOpenSettings(page: Page, user: TestUser) {
    await signInWithTwoFactors(page, user);

    await page.getByRole('button', { name: user.name }).click();
    await page.getByRole('menuitem', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings\/profile/);
}

test('a refused name stays on the profile page', async ({ page }) => {
    const user = createUser({ twoFactor: true });
    await signInAndOpenSettings(page, user);

    await page.getByLabel('Name').fill('x'.repeat(300));
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText(/must not be greater than 255/)).toBeVisible();
    await expect(page).toHaveURL(/\/settings\/profile/);
});

test('a wrong current password stays on the security page', async ({
    page,
}) => {
    const user = createUser({ twoFactor: true });
    await signInAndOpenSettings(page, user);

    await page.getByRole('link', { name: 'Security' }).click();
    await expect(page).toHaveURL(/\/settings\/security/);

    // The form opens from the password's row among the sign-in methods.
    await page.getByRole('button', { name: 'Change', exact: true }).click();
    await page.getByLabel('Current password').fill('not the password');
    await page
        .getByLabel('New password', { exact: true })
        .fill('a new passphrase long enough');
    await page
        .getByLabel('Confirm new password')
        .fill('a new passphrase long enough');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText(/password is incorrect/i)).toBeVisible();
    await expect(page).toHaveURL(/\/settings\/security/);
});
