<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Server Side Rendering
    |--------------------------------------------------------------------------
    |
    | These options configures if and how Inertia uses Server Side Rendering
    | to pre-render each initial request made to your application's pages
    | so that server rendered HTML is delivered for the user's browser.
    |
    | See: https://inertiajs.com/server-side-rendering
    |
    */

    'ssr' => [
        'enabled' => true,
        'url' => 'http://127.0.0.1:13714',
        // 'bundle' => base_path('bootstrap/ssr/ssr.mjs'),

    ],

    /*
    |--------------------------------------------------------------------------
    | Pages
    |--------------------------------------------------------------------------
    |
    | These options configure how Inertia discovers page components on the
    | filesystem. The paths and extensions are used to locate components
    | when rendering responses and during testing assertions.
    |
    */

    'pages' => [

        'paths' => [
            resource_path('js/pages'),
        ],

        'extensions' => [
            'js',
            'jsx',
            'svelte',
            'ts',
            'tsx',
            'vue',
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Testing
    |--------------------------------------------------------------------------
    |
    | The values described here are used to locate Inertia components on the
    | filesystem. For instance, when using `assertInertia`, the assertion
    | attempts to locate the component as a file relative to the paths.
    |
    */

    'testing' => [

        'ensure_pages_exist' => true,

    ],

    /*
    |--------------------------------------------------------------------------
    | Previous URL
    |--------------------------------------------------------------------------
    |
    | Keyring's pages send "Referrer-Policy: no-referrer" (emailed links carry
    | a token in their URL), and the browser keeps that policy until the next
    | full page load. So after signing in, every Inertia request this app
    | makes has no Referer, and Laravel only remembers the last page for full
    | page loads. Without this, a validation error on one of the app's own
    | pages (a name that's too long on Settings, a wrong current password)
    | would redirect "back" to the login page instead of the form. Keyring
    | remembers its own pages itself; this covers the rest.
    |
    */

    'store_previous_url' => true,

];
