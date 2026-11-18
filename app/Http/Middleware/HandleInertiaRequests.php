<?php

namespace App\Http\Middleware;

use App\Support\DemoLocator;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Keyring\Facades\Keyring;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            // Keyring flashes a status key after changes ("device-revoked"...)
            // and "was this you?" alerts after signing in.
            'status' => fn () => $request->session()->get('status'),
            'statusMessage' => fn () => Keyring::statusMessage($request->session()->get('status')),
            'keyringAlerts' => fn () => $request->session()->get('keyring.alerts', []),
            // A recovery code has been used, so it's time to make a new set.
            'replaceRecoveryCodes' => fn () => (bool) $request->user()?->keyring->shouldReplaceRecoveryCodes(),
            // The login page's "Pretend to be in" picker, only with the demo
            // locator (KEYRING_LOCATOR=demo).
            'demoLocation' => fn () => DemoLocator::enabled() ? [
                'current' => DemoLocator::current($request),
                'places' => array_map(fn (array $place) => [
                    'city' => $place['city'],
                    'country' => $place['country'],
                ], DemoLocator::PLACES),
            ] : null,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
