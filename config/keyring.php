<?php

declare(strict_types=1);

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

    // The pages anyone can open stay open to them meanwhile.
    'enrollment_except' => ['home', 'well-known.passkeys'],

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
    | Password Word List
    |--------------------------------------------------------------------------
    |
    | Words a password mustn't be made up of, on top of the app's name and
    | what Keyring knows about the user (their name and email address). This
    | is the documented list OWASP ASVS 6.1.2 asks for: the names of the
    | organisation, its products and its projects.
    |
    */

    'passwords' => [
        'context' => ['Keyring', 'Entity', 'Laravel', 'Starter Kit'],
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
