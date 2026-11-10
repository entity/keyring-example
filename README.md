# Keyring example

Laravel's React starter kit with Fortify taken out and [Keyring](../keyring) put in. Use it to demo Keyring, or to see what moving an app from Fortify to Keyring involves.

What you can try:

- Sign in with a password, a passkey (including from the email field's autofill), an authenticator app, an email code or a recovery code.
- Add and remove sign-in methods from Settings → Security. The first one comes with recovery codes.
- Step-up: Settings → Security and deleting your account need a verification from the last 15 minutes. If you have a second sign-in method, you have to use it; the password alone isn't enough.
- Change your email from Settings → Profile. The new address has to confirm, and the old one gets a link to undo the change. The old address has to confirm too, unless you signed in with a second factor the account has had for a week (the two-factor demo account's is dated a month back).
- See your devices and sign them out, and read the security log.
- Get a "Was this you?" banner on the dashboard after failed sign-in attempts.

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

Passkeys need a secure context. `http://localhost` counts, so open the app as `localhost`, not `127.0.0.1`. `APP_URL` has to match the address in your browser, because Keyring builds the passkey origin and every emailed link from it.

Emails (codes, email change links, security notices) go to `storage/logs/laravel.log`. `composer dev` shows that log as it's written. To see how they look, open `http://localhost:8000/emails` while running locally: it lists every email Keyring sends and shows each with sample content.

## Emails

Keyring writes no emails of its own. `keyring:install` publishes one notification class per email into `app/Notifications/Keyring`, and `App\Providers\KeyringServiceProvider` says which are sent. This app builds them with [Maizzle](https://maizzle.com):

```
resources/emails/
├── components/Shell.vue          # the frame every email shares
└── keyring/
    ├── notice.vue                # all ten security notices
    ├── verification-code.vue
    ├── confirm-email-change.vue
    ├── email-change-notice.vue
    └── email-address-in-use.vue
```

```bash
npm run emails        # build them into resources/views/emails/keyring
npm run emails:dev    # Maizzle's preview server, with hot reload
```

The templates are Vue files with Tailwind classes. Maizzle inlines the CSS and writes each one out as two Blade views, HTML and plain text, which are committed so the app runs without a build. Anything that changes per email is a Blade variable wrapped in `<Raw>`, which Maizzle passes through untouched:

```vue
<Heading class="text-2xl font-semibold"><Raw>{{ $subject }}</Raw></Heading>
```

A notification then returns those views from `toMail()`:

```php
return (new MailMessage)->subject($this->subject())->view(
    ['html' => 'emails.keyring.notice', 'text' => 'emails.keyring.text.notice'],
    ['subject' => $this->subject(), 'intro' => $this->intro(), /* ... */],
);
```

Blade escapes what the HTML views print, so a name someone typed for their security key can't add a link to a genuine security email. The ten security notices share one template through `SecurityNotice::toMail()`; each notice class only says its subject and intro.

## Demo accounts

| Email               | Password   | Second step                                                                                                                              |
| ------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `demo@keyring.test` | `password` | none yet, add one in Settings → Security                                                                                                 |
| `2fa@keyring.test`  | `password` | authenticator app with secret `JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP`, recovery codes `demo1-aaaaa` `demo2-bbbbb` `demo3-ccccc` `demo4-ddddd` |

Add that secret to any authenticator app to get codes for the second account. To put both accounts back the way they started:

```bash
php artisan example:reset
```

## What changed from the starter kit

- `laravel/fortify` and `laravel/chisel` removed. `entity/keyring` added, with its migrations published.
- `App\Models\User` uses `HasKeyring`. Email and password can only change through Keyring's flows.
- `App\Providers\KeyringServiceProvider` turns on every factor, a two-step policy once someone has a second method, every security email and risk signals.
- `app/Notifications/Keyring` holds every email Keyring sends, built from the Maizzle templates in `resources/emails`.
- The kit's page names already match Keyring's (`auth/login`, `auth/challenge`…), so only step-up confirmation is remapped, to the challenge page.
- New pages: `auth/challenge` (second step and step-up) and `auth/email-change` (where emailed links land). Login gained passkey sign-in.
- Settings → Security lists sign-in methods, devices and recent activity. It talks to Keyring's JSON routes through `@entity/keyring` (`resources/js/keyring/actions.ts` handles the 423 step-up answer and shows Keyring's own messages).
- `HandleInertiaRequests` shares the flashed `status` and its message from `Keyring::statusMessage()`.
- `config/inertia.php` turns on `store_previous_url`. Keyring's pages send `Referrer-Policy: no-referrer`, and Laravel doesn't remember Inertia visits as the previous page by itself, so a validation error (a wrong code on the challenge page, say) would otherwise redirect back to whichever page was last loaded in full.
- Settings → Profile changes the name directly and the email through Keyring's confirmed flow.
- The kit's Fortify tests were rewritten against Keyring (`php artisan test`).

## Browser tests

`tests/e2e` drives the real pages in Chromium with Playwright, including passkeys and security keys through Chrome's virtual authenticator:

```bash
npx playwright install chromium   # once
npm run test:browser
```

They build the assets and serve the app on `http://localhost:8137` with a throwaway SQLite database (`database/e2e.sqlite`) and their own `.env.e2e`. Before starting, they check that the booted app really uses that database, so your dev database and server are left alone.

To run the same tests under Octane, with one long-lived FrankenPHP worker (the strictest check that nothing leaks from one person's request to the next):

```bash
php artisan octane:install --server=frankenphp   # once, downloads the server
npm run test:browser:octane
```

There's no CI yet: it would need to check out the private Keyring repository next to this one.
