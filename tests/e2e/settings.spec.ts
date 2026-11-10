import { expect, type Page, test } from '@playwright/test';
import { createUser, signInWithPassword, type TestUser } from './helpers';

/**
 * Sign in and reach Settings the way a person does: one full page load (the
 * login page), then only in-app links. Keyring's pages send
 * `Referrer-Policy: no-referrer`, and the browser keeps that policy until the
 * next full page load, so none of these requests has a Referer. A failed form
 * still has to come back to its own page (`store_previous_url` in
 * config/inertia.php); without that it lands on the dashboard by way of /login.
 */
async function signInAndOpenSettings(page: Page, user: TestUser) {
    await signInWithPassword(page, user.email, user.password);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole('button', { name: user.name }).click();
    await page.getByRole('menuitem', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings\/profile/);
}

test('a refused name stays on the profile page', async ({ page }) => {
    const user = createUser();
    await signInAndOpenSettings(page, user);

    await page.getByLabel('Name').fill('x'.repeat(300));
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText(/must not be greater than 255/)).toBeVisible();
    await expect(page).toHaveURL(/\/settings\/profile/);
});

test('a wrong current password stays on the security page', async ({
    page,
}) => {
    const user = createUser();
    await signInAndOpenSettings(page, user);

    await page.getByRole('link', { name: 'Security' }).click();
    await expect(page).toHaveURL(/\/settings\/security/);

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
