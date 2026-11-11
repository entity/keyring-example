<?php

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
    | it needs, only once it's here.
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
    | Enrollment Page
    |--------------------------------------------------------------------------
    |
    | Your page for adding a sign-in method. Step-up and the keyring.enrolled
    | middleware send users there when they don't have what a route needs.
    | Null answers 403 instead.
    |
    */

    'enrollment_url' => null,

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
