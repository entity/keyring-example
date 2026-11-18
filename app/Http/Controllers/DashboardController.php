<?php

namespace App\Http\Controllers;

use App\Support\DemoLocator;
use Inertia\Inertia;
use Inertia\Response;
use Keyring\Devices\HeaderLocator;
use Keyring\Devices\NullLocator;

class DashboardController extends Controller
{
    /**
     * The "things to try" cards. A few depend on how the app was started,
     * so the cards say which settings are on.
     */
    public function __invoke(): Response
    {
        return Inertia::render('dashboard', [
            'demoSettings' => [
                'locator' => match (config('keyring.devices.locator')) {
                    NullLocator::class => null,
                    HeaderLocator::class => 'cloudflare',
                    DemoLocator::class => 'demo',
                    default => 'other',
                },
                // Sign ins are only checked with BREACHED_PASSWORD_CHECK=true.
                // New passwords are also checked by Keyring's default (null)
                // in production.
                'breachCheck' => [
                    'signIns' => config('keyring.passwords.uncompromised') === true,
                    'newPasswords' => config('keyring.passwords.uncompromised') ?? app()->isProduction(),
                ],
                // The /emails previews only exist while running locally.
                'emailPreviews' => app()->isLocal(),
            ],
        ]);
    }
}
