import { expect, type Browser, type Page, test } from '@playwright/test';
import {
    addVirtualAuthenticator,
    createUser,
    requirePasswordChange,
    signInWithPassword,
    signInWithTwoFactors,
    currentTotp,
    type TestUser,
} from './helpers';

/**
 * The same account signed in from a second browser, with a recovery code:
 * an authenticator app's code works once, so the first browser has spent
 * this half minute's.
 */
async function signInElsewhere(
    browser: Browser,
    user: TestUser,
): Promise<Page> {
    const page = await (await browser.newContext()).newPage();

    await signInWithPassword(page, user.email, user.password);
    await page.getByRole('button', { name: 'Try another way' }).click();
    await page.getByRole('button', { name: /Recovery codes/ }).click();
    await page.getByLabel('Recovery code').fill(user.recoveryCodes[0]);
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    return page;
}

function sessions(page: Page) {
    return page
        .getByRole('listitem')
        .filter({ hasText: /signed in .+ · active/ });
}

async function expectSignedOut(page: Page): Promise<void> {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
    await expect(
        page.getByText("You've been signed out. Please sign in again."),
    ).toBeVisible();
}

test('lists every session and ends one of them', async ({ page, browser }) => {
    const user = createUser({ twoFactor: true });
    await signInWithTwoFactors(page, user);
    const elsewhere = await signInElsewhere(browser, user);

    // A recovery code was used over there, so the account is asked to make
    // a new set.
    await expect(elsewhere.getByText('Make new recovery codes')).toBeVisible();

    await page.goto('/settings/security');
    await expect(sessions(page)).toHaveCount(2);
    await expect(
        sessions(page).filter({ hasText: 'This session' }),
    ).toHaveCount(1);

    await sessions(page)
        .filter({ hasNotText: 'This session' })
        .getByRole('button', { name: 'End session' })
        .click();

    await expect(
        page.getByText('That session has been signed out.'),
    ).toBeVisible();
    await expect(sessions(page)).toHaveCount(1);

    await expectSignedOut(elsewhere);

    // This one carries on.
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
});

test('signs out the other sessions along with adding a sign-in method, when asked', async ({
    page,
    browser,
}) => {
    const user = createUser({ twoFactor: true });
    await addVirtualAuthenticator(page);
    await signInWithTwoFactors(page, user);
    const elsewhere = await signInElsewhere(browser, user);

    await page.goto('/settings/security');
    await expect(sessions(page)).toHaveCount(2);

    await page
        .getByLabel('Sign out my other sessions when I add or remove a method')
        .check();

    const [confirmed] = await Promise.all([
        page.waitForRequest((request) =>
            request.url().endsWith('/user/authenticators/passkey/confirm'),
        ),
        page
            .getByRole('button', { name: 'Add', exact: true })
            .click()
            .then(() =>
                page.getByRole('menuitem', { name: 'Passkey' }).click(),
            ),
    ]);

    expect(confirmed.postDataJSON().sign_out_others).toBe(true);

    await expect(page.getByText('Sign-in method added.')).toBeVisible();
    await expect(sessions(page)).toHaveCount(1);
    await expect(
        page.getByRole('listitem').filter({ hasText: /Passkey · last used/ }),
    ).toHaveCount(1);

    await expectSignedOut(elsewhere);
});

test('leaves the other sessions alone when the box is not ticked', async ({
    page,
    browser,
}) => {
    const user = createUser({ twoFactor: true });
    await addVirtualAuthenticator(page);
    await signInWithTwoFactors(page, user);
    const elsewhere = await signInElsewhere(browser, user);

    await page.goto('/settings/security');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Passkey' }).click();

    await expect(page.getByText('Sign-in method added.')).toBeVisible();
    await expect(sessions(page)).toHaveCount(2);

    await elsewhere.goto('/dashboard');
    await expect(elsewhere).toHaveURL(/\/dashboard/);
});

test('"sign out my other sessions" ends them all, and ending this one signs out', async ({
    page,
    browser,
}) => {
    const user = createUser({ twoFactor: true });
    await signInWithTwoFactors(page, user);
    const elsewhere = await signInElsewhere(browser, user);

    await page.goto('/settings/security');
    await page
        .getByRole('button', { name: 'Sign out my other sessions' })
        .click();

    await expect(
        page.getByText("You've been signed out everywhere else."),
    ).toBeVisible();
    await expect(sessions(page)).toHaveCount(1);
    await expectSignedOut(elsewhere);

    await sessions(page).getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
});

test('holds someone who has to change their password on the page where they do', async ({
    page,
}) => {
    const user = createUser({ twoFactor: true });
    requirePasswordChange(user);

    // They can still sign in, and land on the security page instead.
    await signInWithPassword(page, user.email, user.password);
    await page
        .getByLabel('Code from your authenticator app')
        .fill(await currentTotp(user.totpSecret));
    await page.getByRole('button', { name: 'Verify' }).click();

    await expect(page).toHaveURL(/\/settings\/security/);
    await expect(
        page.getByText('Choose a new password to carry on', { exact: true }),
    ).toBeVisible();

    await page.goto('/settings/profile');
    await expect(page).toHaveURL(/\/settings\/security/);

    await page.getByLabel('Current password').fill(user.password);
    await page
        .getByLabel('New password', { exact: true })
        .fill('a new passphrase long enough');
    await page
        .getByLabel('Confirm new password')
        .fill('a new passphrase long enough');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(
        page.getByText('Your password has been changed.'),
    ).toBeVisible();
    await expect(
        page.getByText('Choose a new password to carry on', { exact: true }),
    ).toBeHidden();

    await page.goto('/settings/profile');
    await expect(page).toHaveURL(/\/settings\/profile/);
});
