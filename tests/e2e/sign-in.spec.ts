import { expect, test } from '@playwright/test';
import {
    addKey,
    addVirtualAuthenticator,
    createUser,
    currentTotp,
    emailedCode,
    expectAskedForSecondFactor,
    mailSentSoFar,
    signInWithPassword,
    signOut,
} from './helpers';

test('signs in with a password and an authenticator app', async ({ page }) => {
    const user = createUser({ twoFactor: true });
    await signInWithPassword(page, user.email, user.password);

    await expect(page).toHaveURL(/\/login\/challenge/);
    await page
        .getByLabel('Code from your authenticator app')
        .fill(await currentTotp(user.totpSecret));
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

test('sends someone with only a password to add a second factor', async ({
    page,
}) => {
    const user = createUser();
    await signInWithPassword(page, user.email, user.password);
    await expectAskedForSecondFactor(page);

    // Every other page sends them back, until they have one.
    await page.goto('/dashboard');
    await expectAskedForSecondFactor(page);
    await page.goto('/settings/profile');
    await expectAskedForSecondFactor(page);

    await addVirtualAuthenticator(page);
    await addKey(page, 'Passkey');
    await expect(
        page.getByText('Add a second factor to carry on'),
    ).toBeHidden();

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
});

test('treats an emailed code as an extra step, not as a second factor', async ({
    page,
}) => {
    const user = createUser();
    await signInWithPassword(page, user.email, user.password);
    await expectAskedForSecondFactor(page);

    let mail = mailSentSoFar();
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByRole('menuitem', { name: /Email code/ }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('an extra step, not a second factor');
    await dialog.getByLabel('Code').fill(await emailedCode(mail));
    await dialog.getByRole('button', { name: 'Confirm' }).click();

    // Added, with no recovery codes (there's no second factor to back up),
    // and the account still has to add a real one.
    await expect(page.getByText('Sign-in method added.')).toBeVisible();
    await expect(
        page
            .getByRole('listitem')
            .filter({ hasText: 'An extra step, not a second factor' }),
    ).toHaveCount(1);
    await expect(
        page.getByRole('heading', { name: 'Save your recovery codes' }),
    ).toBeHidden();
    await expectAskedForSecondFactor(page);

    // Signing in now asks for a code after the password, and the session
    // it makes has still proved one factor.
    await signOut(page);
    await signInWithPassword(page, user.email, user.password);
    await expect(page).toHaveURL(/\/login\/challenge/);

    mail = mailSentSoFar();
    await page.getByRole('button', { name: 'Send code' }).click();
    await page.getByLabel('Code from your email').fill(await emailedCode(mail));
    await page.getByRole('button', { name: 'Verify' }).click();

    await expectAskedForSecondFactor(page);
    await expect(
        page.getByText(/This session:.*One factor \(AAL1\)/),
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
    await expectAskedForSecondFactor(page);
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
    await expectAskedForSecondFactor(page);
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
    await expectAskedForSecondFactor(page);
    await addKey(page, 'Security key');

    await signOut(page);
    await signInWithPassword(page, user.email, user.password);

    // The challenge page prompts for the key on its own.
    await expect(page).toHaveURL(/\/dashboard/);
});
