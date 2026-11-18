# Keyring example

Laravel's React starter kit with Fortify taken out and [Keyring](https://github.com/entity/keyring) put in. Use it to play with Keyring, or to see what moving an app from Fortify to Keyring involves. The welcome page at `http://localhost:8000` has the [demo accounts](#demo-accounts) (with a QR code for the authenticator app) and a short tour, and the dashboard has a card for each thing to try, saying which need a setting turned on.

What you can try:

- Register. The form answers the same whether or not the address has an account, and signs nobody in: you get "check your email", follow the link in `storage/logs/laravel.log`, and sign in. An address that already has an account is emailed instead of being told on the form.
- Sign in with a password, a passkey (including from the email field's autofill), an authenticator app or a recovery code.
- Add a second factor. Everyone needs one here, so an account with only a password is sent to Settings → Security after signing in, and every other page sends it back there until it has a passkey, a security key or an authenticator app. The first one comes with recovery codes.
- Add an email code, and see what it is: an extra step after your password, not a second factor. The session stays at AAL1 and the app still asks for a real one.
- Step-up: Settings → Security and deleting your account need a verification from the last 15 minutes, with the strongest proof the account has. Someone with a security key has to use it to add or remove a sign-in method; a password and an authenticator app's code aren't enough for them.
- Change your email from Settings → Profile. The new address has to confirm, and the old one gets a link to undo the change. The old address has to confirm too, unless you signed in with a second factor the account has had for a week (the two-factor demo account's is dated a month back).
- See your devices and your sessions, with where they are when there's a [locator](#locations), end one or sign out everywhere else (also while adding or removing a sign-in method, with the checkbox), and read the security log: which factors each sign in used, from which browser, and what risk found.
- Get a "Was this you?" banner on the dashboard after failed sign-in attempts, and a reminder to make new recovery codes once one has been used.
- Trip the [risk signals](#risk-signals): get the password wrong five times, wait a minute and sign in, and you're emailed about it. With the demo locator, travel from London to Tokyo in a minute and the sign in is refused.
- Turn on the breached password check (`BREACHED_PASSWORD_CHECK=true`) and sign in to a demo account: `password` is in every breach list, so you're held on Settings → Security until you choose another. A breached new password is refused too.
- Be made to change your password: `php artisan tinker --execute 'Keyring\Facades\Keyring::requirePasswordChange(App\Models\User::firstWhere("email", "2fa@keyring.test"), "Demo");'`, then sign in. Every page sends you to Settings → Security until you have.

## Setup

Keyring isn't published yet, so this app installs it from a checkout next to this one:

```
projects/
├── keyring/           # entity/keyring
└── keyring-example/   # this app
```

Composer symlinks `../keyring`, and Vite and TypeScript read `@entity/keyring` from `../keyring/js/src`. Changes to Keyring show up here straight away.

```bash
composer install
npm install
cp .env.example .env          # Postgres and Redis settings are in here; adjust to taste
php artisan key:generate
php artisan migrate --seed
composer dev                  # http://localhost:8000
```

The app hashes passwords with argon2id (`HASH_DRIVER` in `.env.example`). If your database has accounts from when it used bcrypt, either set `HASH_VERIFY=false`, so they're rehashed as they sign in, or run `php artisan example:reset`. That command is also how to get the demo accounts' recovery codes in the form Keyring makes them now: older, shorter codes are no longer accepted.

Keyring clears out old devices, sessions, email changes and log entries with `keyring:prune`, which it adds to Laravel's scheduler itself (daily at 03:00, see `php artisan schedule:list`). It only runs where the scheduler does: `php artisan schedule:work` locally, or the usual cron entry on a server.

Passkeys need a secure context. `http://localhost` counts, so open the app as `localhost`, not `127.0.0.1`. `APP_URL` has to match the address in your browser, because Keyring builds the passkey origin and every emailed link from it.

Emails (codes, email change links, security notices) go to `storage/logs/laravel.log`. `composer dev` shows that log as it's written. To see how they look, open `http://localhost:8000/emails` while running locally: it lists every email Keyring sends and shows each with sample content.

## Risk signals

`KeyringServiceProvider` runs every one of Keyring's [risk signals](https://github.com/entity/keyring/blob/main/docs/risk.md), and Keyring's own response does the rest: a second factor at medium, an email to the owner from high, a refused sign in at critical.

| Signal                                                                                                        | Here                                                                                                          |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `NewDevice`, `InactiveAccount`, `RepeatedFactorFailures`, `SuccessAfterFailures`, `SessionFingerprintChanged` | always on                                                                                                     |
| `RecentlyChangedRecovery`                                                                                     | always on: email changes are on, and an address that changed in the last week shouldn't be trusted on its own |
| `NewCountry`, `ImpossibleTravel`                                                                              | always on, and quiet until there's a [locator](#locations)                                                    |
| `BreachedPassword`                                                                                            | with `BREACHED_PASSWORD_CHECK=true`, since it calls Have I Been Pwned at every password sign in               |

A new country and impossible travel together score 90, which refuses the sign in.

### Locations

Nothing is located by default. `KEYRING_LOCATOR` in `.env` picks a locator (`config/keyring.php`):

```ini
KEYRING_LOCATOR=demo         # a "Pretend to be in" picker on the login page, for localhost only
KEYRING_LOCATOR=cloudflare   # Cloudflare's CF-IPCountry (and city and coordinates) headers
```

`demo` is `App\Support\DemoLocator`, a demo aid and nothing more: it puts each request wherever the login page's picker says (a cookie, London until you pick), so the location signals can be tried on a machine where every request comes from `127.0.0.1`. Paris after London is a new country, which asks for a second factor. Tokyo or New York straight after is impossible travel too, and the sign in is refused (and logged, and emailed). Locations also show on Settings → Security.

`cloudflare` is Keyring's `HeaderLocator`. Only use it when every request has to come through Cloudflare: anyone who can reach the app directly can send those headers and say where they are. For a real lookup by IP address, see [Locations with stevebauman/location](https://github.com/entity/keyring/blob/main/docs/recipes.md#locations-with-stevebaumanlocation).

### Breached passwords

Checking passwords against Have I Been Pwned is a network call, so it's off here, production included (Keyring's own default runs it in production):

```ini
BREACHED_PASSWORD_CHECK=true              # refuse breached new passwords, and add the BreachedPassword signal
BREACHED_PASSWORD_REFUSE_UNCHECKED=true   # refuse a new password while the service can't be reached
```

Only the first five characters of the password's SHA-1 leave the server.

## Emails

Keyring sends its own emails, and this app gives every one of them its look with [Maizzle](https://maizzle.com): the twelve security notices, the five emails a flow needs, and Laravel's own verification and password reset emails.

```
resources/emails/
├── components/               # the design: Shell (logo, card, footer), Hero, Details,
│                             # Action (Outlook-safe button), Callout, tones.ts...
├── images.mjs                # draws the logo and icons into public/images/emails
└── keyring/
    ├── notice.vue            # all twelve security notices
    ├── verification-code.vue
    ├── confirm-email-change.vue
    ├── email-change-notice.vue
    ├── email-address-in-use.vue
    ├── already-registered.vue
    ├── verify-email.vue      # Laravel's VerifyEmail
    └── reset-password.vue    # Laravel's ResetPassword
```

```bash
npm run emails         # build them into resources/views/emails/keyring
npm run emails:dev     # Maizzle's preview server, with hot reload
npm run emails:images  # redraw the logo and icons after changing the list
```

The templates are Vue files with Tailwind classes. Maizzle inlines the CSS and writes each one out as two Blade views, HTML and plain text, which are committed so the app runs without a build. Anything that changes per email is a Blade variable wrapped in `<Raw>`, which Maizzle passes through untouched:

```vue
<Lead><Raw>{{ $intro }}</Raw></Lead>
```

Every email has the same frame: the logo, a card with an icon and a coloured bar in the email's tone, and a footer saying why it was sent and, for the security emails, who to contact if it wasn't you. Alerts (a new device, unusual activity, a failed second step, a locked account, a copied key) are red or amber, confirmations (a new password, a sign-in method added, a changed email address) green, and the rest indigo. Codes get a large code block, and links a button with the full link under it for mail apps that won't open it. Dark mode follows `prefers-color-scheme` where the mail app supports it. The logo and icons are PNGs, since many mail apps won't show an SVG.

Keyring sends the security notices itself, so the app only gives them their look. One callback in `KeyringServiceProvider` builds every notice from `notice.vue`, and `App\Notifications\Keyring\NoticeMail` picks each notice's tone, icon, label, details (the key's name, the recovery codes left, what the risk signals noticed) and advice:

```php
SecurityNotice::toMailUsing(Notifications\NoticeMail::build(...));
VerifyEmail::toMailUsing(Notifications\LaravelMail::verifyEmail(...));
ResetPassword::toMailUsing(Notifications\LaravelMail::resetPassword(...));
```

The five emails a flow needs (the emailed code, the two for an email change, and the two that answer an address that's already taken) each have their own template, so they're the app's own classes in `app/Notifications/Keyring`, registered with `Keyring::notifications()`.

Blade escapes what the HTML views print, so a name someone typed for their security key can't add a link to a genuine security email. The plain text views print values as they are, since there's no markup to protect.

While developing, [`/emails`](http://localhost:8000/emails) shows a gallery of every email with sample content, `/emails/{type}` one of them and `/emails/{type}/text` its plain text. The pages only exist when `APP_ENV` is `local`.

## Demo accounts

| Email               | Password   | Second step                                                                                                                                            |
| ------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `demo@keyring.test` | `password` | none yet: signing in takes you to Settings → Security to add one                                                                                       |
| `2fa@keyring.test`  | `password` | authenticator app with secret `JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP`, recovery codes `demo-code-aaaa-aaaa-aaaa-aaaa-aa` and the same with `b`, `c` and `d` |

Add that secret to any authenticator app to get codes for the second account. A code works during its own 30 seconds only, so the phone's clock has to be right. Recovery codes are 26 characters, typed with or without the dashes. To put both accounts back the way they started:

```bash
php artisan example:reset
```

## What changed from the starter kit

- `laravel/fortify` and `laravel/chisel` removed. `entity/keyring` added, with its migrations published.
- `App\Models\User` uses `HasKeyring`. Email and password can only change through Keyring's flows.
- `App\Providers\KeyringServiceProvider` turns on every factor, a two-factor policy once someone has a second factor, the `keyring.enrolled` middleware that makes everyone add one, every security email and every risk signal (the breached password one behind a setting).
- `config/keyring.php` has the features, the page people are sent to for a second factor or a new password (both `/settings/security`), the list of words a password mustn't be made up of, the breached password check and the locator, both picked from `.env`.
- `app/Notifications/Keyring` holds every email Keyring sends, built from the Maizzle templates in `resources/emails`.
- The kit's page names already match Keyring's (`auth/login`, `auth/challenge`…), so only step-up confirmation is remapped, to the challenge page.
- New pages: `auth/challenge` (second step and step-up), and the pages emailed links open, each with one button that posts the link's token or signature in the body: `auth/email-change`, `auth/device-report` and `auth/email-verification`. Login gained passkey sign-in, and shows Keyring's message for whatever sent you there.
- A welcome page about the demo instead of Laravel's, a key for a logo, and sidebar links to this repository and Keyring's docs.
- Settings → Security lists sign-in methods (the password form opens from the password's row), where you're signed in (devices and sessions, with one "Sign out everywhere else"), and recent activity. It talks to Keyring's JSON routes through `@entity/keyring` (`resources/js/keyring/actions.ts` handles the 423 step-up answer and shows Keyring's own messages).
- `HandleInertiaRequests` shares the flashed `status` and its message from `Keyring::statusMessage()`.
- Settings → Profile changes the name directly and the email through Keyring's confirmed flow.
- The kit's Fortify tests were rewritten against Keyring (`php artisan test`).

## OWASP ASVS

Keyring's docs have a page on what to turn on for each level of [OWASP ASVS 5.0.0](https://github.com/OWASP/ASVS/tree/v5.0.0_release/5.0), chapters V6 and V7. This app is set up for Level 2 as far as configuration goes:

|                                                                                                          | Where                                                                                    |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| A second factor for everyone (6.3.3)                                                                     | `keyring.enrolled` in `KeyringServiceProvider`, `enrollment_url` in `config/keyring.php` |
| Passwords of 64 characters and more (6.2.9)                                                              | `HASH_DRIVER=argon2id`                                                                   |
| Authenticator app codes good for 30 seconds (6.5.5)                                                      | `Totp` with `window` 0 in `KeyringServiceProvider`                                       |
| Registration, sign in and password resets that don't say who has an account (6.3.8)                      | `registration.reveal_taken` left off                                                     |
| A list of words passwords mustn't be made up of (6.1.2, 6.2.11)                                          | `passwords.context` in `config/keyring.php`                                              |
| An inactivity timeout and an overall one (7.3.1, 7.3.2)                                                  | Keyring's defaults: two hours unused, 30 days in all                                     |
| Seeing and ending sessions, and the offer to end the others when a sign-in method changes (7.4.3, 7.5.2) | Settings → Security                                                                      |
| Emails about changes and suspicious sign ins (6.3.5, 6.3.7)                                              | every notice registered in `KeyringServiceProvider`                                      |
| The security log, pruned daily                                                                           | `Features::securityLog()`, and Laravel's scheduler                                       |
| Passwords checked against breaches (6.2.12)                                                              | off here, as it's a network call: `BREACHED_PASSWORD_CHECK=true` turns it on             |

`tests/Feature/KeyringConformanceTest.php` runs Keyring's own conformance suite against this setup.

What a demo can't be, and a real app still has to do: serve over HTTPS (with `SESSION_SECURE_COOKIE=true`, which also gives Keyring's cookies their `__Host-` names), leave out the seeded accounts and their published password, write down its timeouts and its word list, and give administrators a way to end someone's sessions (`php artisan keyring:sign-out`) and a process for someone who has lost every sign-in method. One thing here goes against Level 3 on purpose: email codes are registered, to show what they are.

## Browser tests

`tests/e2e` drives the real pages in Chromium with Playwright, including passkeys and security keys through Chrome's virtual authenticator:

```bash
npx playwright install chromium   # once
npm run test:browser
```

They build the assets and serve the app on `http://localhost:8137` with a throwaway SQLite database (`database/e2e.sqlite`) and their own `.env.e2e`. Mail is written to `storage/logs/laravel.log`, where the tests read the links and codes it carries. Before starting, they check that the booted app really uses that database, so your dev database and server are left alone.

To run the same tests under Octane, with one long-lived FrankenPHP worker (the strictest check that nothing leaks from one person's request to the next):

```bash
php artisan octane:install --server=frankenphp   # once, downloads the server
npm run test:browser:octane
```

Or with several workers, each replaced after a few requests:

```bash
E2E_OCTANE_WORKERS=8 E2E_OCTANE_MAX_REQUESTS=20 npm run test:browser:octane
```

`tests/e2e/attestation.spec.ts` covers security keys that have to prove who made them. The demo takes any security key, and these settings (only the browser tests set them, by adding them to `.env.e2e` and reloading Octane's workers) turn that on:

```ini
SECURITY_KEY_ATTESTATION=true                       # requireAttestation() on the security key factor
KEYRING_ATTESTATION_ROOTS=/path/to/maker-root.pem   # the makers to trust, separated by commas
SECURITY_KEY_MODELS=2fc0579f-8113-47ea-b116-bb5a8db9202a   # optional: allowOnly() these AAGUIDs
```

Chrome's virtual authenticator attests with a certificate it signs itself and makes afresh for every registration, always with the same key. So the tests read one from a registration of their own and have the app trust that as the maker's root. For a maker the app doesn't trust they use Yubico's real root (`tests/e2e/fixtures`). A real key's certificate chain, and the browser asking the person whether the site may see the key's make and model, are not covered by this.

`KEYRING_REVEAL_TAKEN=true` is one more setting only the browser tests use. It turns on `keyring.registration.reveal_taken`, for the two pages nobody reaches without it: with it a new user is signed in before verifying their address, sees `auth/verify-email`, and verifies with the button on `auth/email-verification`.

There's no CI yet: it would need to check out the private Keyring repository next to this one.
