# Keyring example

Laravel's React starter kit with Fortify taken out and [Keyring](../keyring) put in. Use it to demo Keyring, or to see what moving an app from Fortify to Keyring involves.

What you can try:

- Sign in with a password, a passkey (including from the email field's autofill), an authenticator app, an email code or a recovery code.
- Add and remove sign-in methods from Settings → Security. The first one comes with recovery codes.
- Step-up: Settings → Security and deleting your account need a verification from the last 15 minutes. If you have a second sign-in method, you have to use it; the password alone isn't enough.
- Change your email from Settings → Profile. The new address has to confirm, and the old one gets a link to undo the change.
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

Emails (codes, email change links, security notices) go to `storage/logs/laravel.log`. `composer dev` shows that log as it's written.

## Demo accounts

| Email | Password | Second step |
|---|---|---|
| `demo@keyring.test` | `password` | none yet, add one in Settings → Security |
| `2fa@keyring.test` | `password` | authenticator app with secret `JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP`, recovery codes `demo1-aaaaa` `demo2-bbbbb` `demo3-ccccc` `demo4-ddddd` |

Add that secret to any authenticator app to get codes for the second account. To put both accounts back the way they started:

```bash
php artisan example:reset
```

## What changed from the starter kit

- `laravel/fortify` and `laravel/chisel` removed. `entity/keyring` added, with its migrations published.
- `App\Models\User` uses `HasKeyring`. Email and password can only change through Keyring's flows.
- `App\Providers\KeyringServiceProvider` turns on every factor, a two-step policy once someone has a second method, security emails and risk signals.
- The kit's page names already match Keyring's (`auth/login`, `auth/challenge`…), so only step-up confirmation is remapped, to the challenge page.
- New pages: `auth/challenge` (second step and step-up) and `auth/email-change` (where emailed links land). Login gained passkey sign-in.
- Settings → Security lists sign-in methods, devices and recent activity. It talks to Keyring's JSON routes through `@entity/keyring` (`resources/js/keyring/actions.ts` handles the 423 step-up answer).
- Settings → Profile changes the name directly and the email through Keyring's confirmed flow.
- The kit's Fortify tests were rewritten against Keyring (`php artisan test`).

There's no CI yet: it would need to check out the private Keyring repository next to this one.
