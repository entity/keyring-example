<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Attestation
    |--------------------------------------------------------------------------
    |
    | Off, the demo takes any security key. On, a new key has to prove who
    | made it: KeyringServiceProvider adds requireAttestation() to the
    | security key factor, and Keyring only takes keys whose certificates
    | chain to a root in keyring.webauthn.attestation_roots.
    |
    */

    'attestation' => (bool) env('SECURITY_KEY_ATTESTATION', false),

    /*
    |--------------------------------------------------------------------------
    | Models
    |--------------------------------------------------------------------------
    |
    | With attestation on, the only models to take, by AAGUID and separated by
    | commas. Leave it empty to take any model the roots vouch for.
    |
    */

    'models' => array_values(array_filter(explode(',', (string) env('SECURITY_KEY_MODELS')))),

];
