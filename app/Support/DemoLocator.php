<?php

namespace App\Support;

use Illuminate\Http\Request;
use Keyring\Contracts\LocatesIps;

/**
 * A pretend location, for trying the location risk signals on your own
 * machine, where every request comes from 127.0.0.1 and no real lookup
 * could say where it is. Each request is wherever the login page's picker
 * last put this browser (a cookie), and London until then.
 *
 * Only for the demo: anyone can set the cookie and be wherever they like.
 * A real app looks the IP address up (see "Locations" in Keyring's docs),
 * or reads its proxy's headers, as KEYRING_LOCATOR=cloudflare does.
 */
class DemoLocator implements LocatesIps
{
    public const string COOKIE = 'demo_location';

    /**
     * London and Paris are under 500 km apart, so going between them is a
     * new country but not impossible travel. New York and Tokyo are far
     * enough from either for both.
     */
    public const array PLACES = [
        'london' => ['country' => 'GB', 'city' => 'London', 'latitude' => 51.5072, 'longitude' => -0.1276],
        'paris' => ['country' => 'FR', 'city' => 'Paris', 'latitude' => 48.8566, 'longitude' => 2.3522],
        'new-york' => ['country' => 'US', 'city' => 'New York', 'latitude' => 40.7128, 'longitude' => -74.0060],
        'tokyo' => ['country' => 'JP', 'city' => 'Tokyo', 'latitude' => 35.6762, 'longitude' => 139.6503],
    ];

    public const string DEFAULT = 'london';

    /**
     * @return array<string, mixed>
     */
    public function locate(Request $request): array
    {
        return self::PLACES[self::current($request)];
    }

    /**
     * The place this browser picked, or London.
     */
    public static function current(Request $request): string
    {
        $place = $request->cookie(self::COOKIE);

        return is_string($place) && array_key_exists($place, self::PLACES) ? $place : self::DEFAULT;
    }

    public static function enabled(): bool
    {
        return config('keyring.devices.locator') === self::class;
    }
}
