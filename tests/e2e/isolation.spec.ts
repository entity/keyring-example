import { expect, test } from '@playwright/test';
import {
    createUser,
    currentTotp,
    expectAskedForSecondFactor,
    signInWithPassword,
} from './helpers';

/**
 * Two people using the app at the same moment. Under Octane the workers keep
 * the app in memory between requests, so this is where one person's sign in,
 * session or assurance would leak into the other's.
 */
test('keeps two people signing in at once apart', async ({ browser }) => {
    const first = createUser({ twoFactor: true });
    const second = createUser();
    const firstPage = await (await browser.newContext()).newPage();
    const secondPage = await (await browser.newContext()).newPage();

    // The first gets halfway, the second signs in completely in between.
    await signInWithPassword(firstPage, first.email, first.password);
    await expect(firstPage).toHaveURL(/\/login\/challenge/);

    // With only a password, the second is sent to add a second factor.
    await signInWithPassword(secondPage, second.email, second.password);
    await expectAskedForSecondFactor(secondPage);

    await firstPage
        .getByLabel('Code from your authenticator app')
        .fill(await currentTotp(first.totpSecret));
    await firstPage.getByRole('button', { name: 'Verify' }).click();
    await expect(firstPage).toHaveURL(/\/dashboard/);

    // Each sees only themselves, at the level they actually reached.
    for (const [page, user, level] of [
        [firstPage, first, 'AAL2'],
        [secondPage, second, 'AAL1'],
    ] as const) {
        await page.goto('/settings/security');
        await expect(page.getByText(user.name).first()).toBeVisible();
        await expect(
            page.getByText(new RegExp(`This session:.*\\(${level}\\)`)),
        ).toBeVisible();
    }

    await expect(firstPage.getByText(second.name)).toHaveCount(0);
    await expect(secondPage.getByText(first.name)).toHaveCount(0);
});
