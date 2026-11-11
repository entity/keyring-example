import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import {
    createUser,
    emailedLink,
    emailedLinks,
    expectAskedForSecondFactor,
    forgetRateLimits,
    mailSentSoFar,
    signInWithPassword,
    signInWithTwoFactors,
} from './helpers';

test.beforeEach(() => forgetRateLimits());

/**
 * The pages emailed links open. The link carries a token or a signature in
 * its address; the page's button posts it in the body, to an address
 * without it, and only that changes anything.
 */
test('confirms an email change from the pages its links open, then undoes it', async ({
    page,
    browser,
}) => {
    const user = createUser({ twoFactor: true });
    const address = `e2e-${randomUUID()}@keyring.test`;
    await signInWithTwoFactors(page, user);

    await page.goto('/settings/profile');
    const mail = mailSentSoFar();
    await page.getByLabel('New email address').fill(address);
    await page.getByRole('button', { name: 'Send confirmation' }).click();
    await expect(page.getByText(`Changing to ${address}`)).toBeVisible();

    // The second factor is new, so both addresses were sent a link to
    // confirm with: the new one first, then the current one.
    const confirm = await emailedLinks(
        /http:\/\/localhost:\d+\/email-changes\/\w+\/confirm\/\w+/,
        mail,
        2,
    );
    expect(confirm).toHaveLength(2);

    for (const [index, link] of confirm.entries()) {
        await page.goto(link);
        await expect(
            page.getByText(
                'Press the button to confirm this email address change.',
            ),
        ).toBeVisible();

        const [posted] = await Promise.all([
            page.waitForRequest((request) => request.method() === 'POST'),
            page.getByRole('button', { name: 'Confirm the change' }).click(),
        ]);

        // The token went in the body, not in the address.
        expect(new URL(posted.url()).pathname).toMatch(
            /^\/email-changes\/\w+\/confirm$/,
        );
        expect(posted.postDataJSON()).toEqual({
            token: link.split('/').pop(),
        });

        await expect(page).toHaveURL(/\/dashboard/);
        await expect(
            page.getByText(
                index === 0
                    ? 'Thanks! The change applies once the other address confirms too.'
                    : 'Your email address has been changed.',
            ),
        ).toBeVisible();
    }

    await page.goto('/settings/profile');
    await expect(page.getByText(`Currently ${address}`)).toBeVisible();

    // The old address can still undo it, from a browser that isn't signed in.
    const inbox = await (await browser.newContext()).newPage();
    await inbox.goto(
        await emailedLink(
            /http:\/\/localhost:\d+\/email-changes\/\w+\/revert\/\w+/,
            mail,
        ),
    );
    await inbox
        .getByRole('button', { name: 'This wasn’t me, undo it' })
        .click();

    await expect(inbox).toHaveURL(/\/forgot-password$/);
    await expect(
        inbox.getByText(/Your old email address is back/),
    ).toBeVisible();

    // Undoing signs every session out.
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
});

test('signs a device out from the "this wasn\'t me" link in the new sign-in email', async ({
    page,
    browser,
}) => {
    const user = createUser();
    const mail = mailSentSoFar();

    await signInWithPassword(page, user.email, user.password);
    await expectAskedForSecondFactor(page);

    const link = await emailedLink(
        /http:\/\/localhost:\d+\/devices\/\w+\/report\?[^\s"<]+/,
        mail,
    );

    // Opened somewhere else, signed out.
    const inbox = await (await browser.newContext()).newPage();
    await inbox.goto(link);
    await expect(inbox.getByText(/This signs out .+ and every/)).toBeVisible();

    // Opening it did nothing.
    await page.goto('/settings/security');
    await expect(page).toHaveURL(/\/settings\/security/);

    const [posted] = await Promise.all([
        inbox.waitForRequest((request) => request.method() === 'POST'),
        inbox.getByRole('button', { name: 'Sign that device out' }).click(),
    ]);

    expect(new URL(posted.url()).search).toBe('');
    expect(posted.postDataJSON()).toEqual({
        expires: new URL(link).searchParams.get('expires'),
        signature: new URL(link).searchParams.get('signature'),
    });

    await expect(inbox).toHaveURL(/\/login$/);
    await expect(
        inbox.getByText(
            "We've signed that device out. We recommend changing your password now.",
        ),
    ).toBeVisible();

    await page.goto('/settings/security');
    await expect(page).toHaveURL(/\/login$/);
});
