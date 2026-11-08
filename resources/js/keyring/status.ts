/**
 * Keyring flashes short status keys after actions. Anything else (like a
 * translated password reset message) is shown as it is.
 */
const messages: Record<string, string> = {
    'authenticator-added': 'Sign-in method added.',
    'authenticator-updated': 'Sign-in method updated.',
    'authenticator-removed': 'Sign-in method removed.',
    'code-sent': 'We sent you a new code.',
    'device-revoked': 'That device has been signed out.',
    'sessions-revoked': 'Signed out everywhere else.',
    'password-updated': 'Password updated.',
    'verification-link-sent':
        'A new verification link has been sent to your email address.',
    'email-change-requested': 'Check both inboxes to confirm the change.',
    'email-change-cancelled': 'Email change cancelled.',
    'email-change-confirmed':
        'Thanks! The change applies once the other address confirms too.',
    'email-changed': 'Your email address has been changed.',
    'email-change-reverted':
        'Your email address was put back and every session signed out. Reset your password to be safe.',
    'email-change-invalid': 'That link has expired or was already used.',
};

export function statusMessage(status?: string | null): string | null {
    return status ? (messages[status] ?? status) : null;
}
