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
                'breachCheck' => (bool) config('keyring.passwords.uncompromised'),
                // The /emails previews only exist while running locally.
                'emailPreviews' => app()->isLocal(),
            ],
        ]);
    }
}
