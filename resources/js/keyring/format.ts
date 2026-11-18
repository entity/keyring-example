/**
 * Small helpers for showing what Keyring stores, the same way on every page.
 */

/** A location as Keyring keeps it (keyring.devices.locator). */
export type Place = {
    country?: string;
    region?: string;
    city?: string;
} | null;

const countries = new Intl.DisplayNames(undefined, { type: 'region' });

/**
 * "Tokyo, Japan", or whatever part of it is known. Locators give the
 * country as a two letter code.
 */
export function place(location: Place | undefined): string | null {
    if (!location) {
        return null;
    }

    let country: string | undefined = location.country;

    try {
        country = country ? countries.of(country) : undefined;
    } catch {
        // Not a code the browser knows: show it as it came.
    }

    return [location.city, country].filter(Boolean).join(', ') || null;
}

/** How each factor's key reads in a sentence. */
const factorNames: Record<string, string> = {
    password: 'password',
    passkey: 'passkey',
    'security-key': 'security key',
    totp: 'authenticator app',
    'email-code': 'emailed code',
    recovery: 'recovery code',
};

export function factorName(factor: string): string {
    return factorNames[factor] ?? factor;
}

/** "password and authenticator app" */
export function factorList(factors: string[]): string {
    const names = factors.map(factorName);

    return names.length > 1
        ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
        : (names[0] ?? '');
}

const dateTime = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
});

/** The full date and time, for a title beside a relative one. */
export function fullDate(iso: string): string {
    return dateTime.format(new Date(iso));
}
