<?php

declare(strict_types=1);

use App\Support\DemoLocator;
use Keyring\Devices\HeaderLocator;
use Keyring\Devices\NullLocator;
use Keyring\Features;

return [

    /*
    |--------------------------------------------------------------------------
    | Guard, Username and Home
    |--------------------------------------------------------------------------
    |
    | The guard Keyring signs users in to, the attribute they sign in with,
    | and where they go once they have.
    |
    */

    'guard' => 'web',

    'username' => 'email',

    'home' => '/dashboard',

    /*
    |--------------------------------------------------------------------------
    | Features
    |--------------------------------------------------------------------------
    |
    | Signing in and out, challenges and step-up are always on. Add the rest
    | as your app needs them. Each one brings its routes, and anything else
    | it needs, only once it's here. Without the security log, its events
    | are written to your app's log instead.
    |
    */

    'features' => [
        Features::registration(),
        Features::resetPasswords(),
        Features::emailVerification(),
        Features::updatePasswords(),
        Features::manageAuthenticators(),
        Features::devices(),
        Features::emailChanges(),
        Features::securityLog(),
    ],

    /*
    |--------------------------------------------------------------------------
    | Registration
    |--------------------------------------------------------------------------
    |
    | Registering answers the same whether or not the address has an account,
    | and new users sign in once they've followed the link emailed to them.
    | Set "reveal_taken" to true to say when an address is taken and sign new
    | users in straight away, which lets anyone check who has an account.
    |
    | The demo keeps it off. KEYRING_REVEAL_TAKEN is only here so the browser
    | tests can show the two pages nobody reaches without it: the "check your
    | inbox" page and the one the emailed link opens for a signed-in user.
    |
    */

    'registration' => [
        'reveal_taken' => (bool) env('KEYRING_REVEAL_TAKEN', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Enrollment Page
    |--------------------------------------------------------------------------
    |
    | Your page for adding a sign-in method. Step-up and the keyring.enrolled
    | middleware send users there when they don't have what a route needs.
    | Null answers 403 instead.
    |
    | Everyone here needs a second factor (KeyringServiceProvider adds
    | keyring.enrolled to every page), so this is where someone with only a
    | password lands after signing in.
    |
    */

    'enrollment_url' => '/settings/security',

    // The pages anyone can open stay open to them meanwhile, and so do the
    // local-only links into each state of the app (example:links).
    'enrollment_except' => ['home', 'well-known.passkeys', 'demo.state'],

    /*
    |--------------------------------------------------------------------------
    | Support Contact
    |--------------------------------------------------------------------------
    |
    | Where users can reach you about their account: a page's URL or an email
    | address. The security emails then end by saying who to contact if
    | something wasn't them. Null leaves that line out.
    |
    */

    'support_contact' => env('KEYRING_SUPPORT_CONTACT', 'support@example.com'),

    /*
    |--------------------------------------------------------------------------
    | Password Change Page
    |--------------------------------------------------------------------------
    |
    | Where a user who has to choose a new password is sent from every other
    | page until they have: after Keyring::requirePasswordChange($user), or a
    | risk response with requirePasswordChange(). The form is on the security
    | settings page, which says why they were sent there.
    |
    */

    'password_change_url' => '/settings/security',

    /*
    |--------------------------------------------------------------------------
    | Password Word List and Breached Passwords
    |--------------------------------------------------------------------------
    |
    | Words a password mustn't be made up of, on top of the app's name and
    | what Keyring knows about the user (their name and email address). This
    | is the documented list OWASP ASVS 6.1.2 asks for: the names of the
    | organisation, its products and its projects.
    |
    | New passwords are checked against Have I Been Pwned as Keyring does by
    | default: in production only, so local and test runs make no network
    | calls. BREACHED_PASSWORD_CHECK=true checks them everywhere, and
    | KeyringServiceProvider then adds the BreachedPassword signal, which
    | checks the password at every sign in too and sends a user whose
    | password it finds to choose another. BREACHED_PASSWORD_CHECK=false
    | turns the check off, production included. Only the first five
    | characters of the password's SHA-1 leave the server.
    |
    | When the service can't be reached, a new password is let through.
    | BREACHED_PASSWORD_REFUSE_UNCHECKED refuses it instead, and asks the
    | user to try again in a moment.
    |
    */

    'passwords' => [
        'context' => ['Keyring', 'Entity', 'Laravel', 'Starter Kit'],
        // Unset (or empty) leaves Keyring's default: null.
        'uncompromised' => match ($check = env('BREACHED_PASSWORD_CHECK')) {
            null, '' => null,
            default => (bool) $check,
        },
        'refuse_unchecked' => (bool) env('BREACHED_PASSWORD_REFUSE_UNCHECKED', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Locations
    |--------------------------------------------------------------------------
    |
    | Where each sign in comes from, for the device list and the NewCountry
    | and ImpossibleTravel signals. Nothing by default, and KEYRING_LOCATOR
    | picks one:
    |
    | "cloudflare" reads the headers Cloudflare adds (CF-IPCountry, and with
    | its "Add visitor location headers" transform the city and the
    | coordinates). Only use it when every request has to come through
    | Cloudflare: anyone who can reach the app directly can send those
    | headers themselves and say where they are.
    |
    | "demo" is for playing with on your own machine, never for a real app.
    | It puts every request wherever the login page's "Pretend to be in"
    | picker says (London until you pick), so you can travel from London to
    | Tokyo in a minute and watch the sign in get refused. Anyone can say
    | where they are with it, so it's only taken when APP_ENV is local or
    | testing: anywhere else, KEYRING_LOCATOR=demo means no locator.
    |
    */

    'devices' => [
        'locator' => match (env('KEYRING_LOCATOR')) {
            'cloudflare' => HeaderLocator::class,
            'demo' => in_array(env('APP_ENV'), DemoLocator::ENVIRONMENTS, true) ? DemoLocator::class : NullLocator::class,
            default => NullLocator::class,
        },
    ],

    /*
    |--------------------------------------------------------------------------
    | Security Key Attestation
    |--------------------------------------------------------------------------
    |
    | The demo takes any security key. With SECURITY_KEY_ATTESTATION set (see
    | config/security_keys.php) it only takes keys whose maker vouches for
    | them, and these are the makers' root certificates it trusts: full paths
    | to PEM files, separated by commas.
    |
    */

    'webauthn' => [
        'attestation_roots' => array_values(array_filter(explode(',', (string) env('KEYRING_ATTESTATION_ROOTS')))),
    ],

    /*
    |--------------------------------------------------------------------------
    | Everything Else
    |--------------------------------------------------------------------------
    |
    | Sessions, passwords, devices, rate limits and the rest keep Keyring's
    | defaults. "Configuration" in the docs lists every option: copy one in
    | here to change it.
    |
    */

];
