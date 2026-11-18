import { expect, type Page, test } from '@playwright/test';
import { createUser, signInWithTwoFactors, type TestUser } from './helpers';

/** The sign-in methods list, apart from the activity rows that name them. */
function methods(page: Page) {
    return page.getByRole('list', { name: 'Sign-in methods' });
}

async function signInAndManage(page: Page, user: TestUser): Promise<void> {
    await signInWithTwoFactors(page, user);

    await page.goto('/settings/security');
    await methods(page)
        .getByRole('listitem')
        .filter({ hasText: 'Authenticator app' })
        .getByRole('button', { name: 'Manage' })
        .click();
    await page.getByRole('menuitem', { name: 'Remove' }).click();
}

test('asks for the password before removing the last second factor', async ({
    page,
}) => {
    const user = createUser({
        twoFactor: true,
        password: 'a passphrase long enough alone',
    });
    await signInAndManage(page, user);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Remove your last second factor?');
    await dialog.getByLabel('Password').fill(user.password);
    await dialog.getByRole('button', { name: 'Remove' }).click();

    await expect(dialog).toBeHidden();
    // Recent activity lists the removal too, so only the methods count.
    await expect(
        methods(page)
            .getByRole('listitem')
            .filter({ hasText: 'Authenticator app' }),
    ).toHaveCount(0);
});

test('keeps the last second factor while the password is too short alone', async ({
    page,
}) => {
    const user = createUser({ twoFactor: true });
    await signInAndManage(page, user);

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Password').fill(user.password);
    await dialog.getByRole('button', { name: 'Remove' }).click();

    await expect(page.getByText(/needs at least 15 characters/)).toBeVisible();
    await expect(dialog).toBeVisible();
});
