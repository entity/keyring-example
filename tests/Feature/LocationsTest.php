<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\DemoLocator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia as Assert;
use Keyring\Devices\HeaderLocator;
use Keyring\Devices\NullLocator;
use Keyring\Models\SecurityEvent;
use Tests\TestCase;

class LocationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_keyring_locator_picks_the_locator()
    {
        $this->assertSame(NullLocator::class, $this->locatorFor(null));
        $this->assertSame(HeaderLocator::class, $this->locatorFor('cloudflare'));
        $this->assertSame(DemoLocator::class, $this->locatorFor('demo'));
        $this->assertSame(NullLocator::class, $this->locatorFor('something else'));
    }

    public function test_without_a_locator_devices_have_no_location()
    {
        $user = User::factory()->create();

        $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password'], ['CF-IPCountry' => 'NL']);

        $this->assertAuthenticatedAs($user);
        $this->assertNull($user->devices()->sole()->location);
    }

    public function test_behind_cloudflare_a_sign_in_is_where_its_headers_say()
    {
        config(['keyring.devices.locator' => HeaderLocator::class]);
        $user = User::factory()->create();

        $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password'], [
            'CF-IPCountry' => 'NL',
            'CF-IPCity' => 'Amsterdam',
        ]);

        $this->assertAuthenticatedAs($user);
        $this->assertSame(['country' => 'NL', 'city' => 'Amsterdam'], $user->devices()->sole()->location);
    }

    public function test_the_demo_locator_is_in_london_until_another_place_is_picked()
    {
        config(['keyring.devices.locator' => DemoLocator::class]);
        $user = User::factory()->create();

        $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password']);

        $this->assertSame('London', $user->devices()->sole()->location['city']);
    }

    /**
     * Paris is a new country, but close enough to London to have got there.
     * Only a second factor is asked for, and this user hasn't one yet.
     */
    public function test_a_new_country_alone_lets_the_sign_in_through()
    {
        config(['keyring.devices.locator' => DemoLocator::class]);
        $user = User::factory()->create();
        $this->signInFrom($user, 'london');
        $this->post(route('logout'));

        $this->signInFrom($user, 'paris');

        $this->assertAuthenticatedAs($user);
        $this->assertContains('FR', $user->devices()->pluck('location')->pluck('country'));
    }

    /**
     * Tokyo a minute after London is a new country and impossible travel:
     * 90 together, which refuses the sign in and emails the owner.
     */
    public function test_impossible_travel_to_a_new_country_refuses_the_sign_in()
    {
        config(['keyring.devices.locator' => DemoLocator::class]);
        $user = User::factory()->create();
        $this->signInFrom($user, 'london');
        $this->post(route('logout'));

        $this->signInFrom($user, 'tokyo')->assertSessionHasErrors('email');

        $this->assertGuest();
        $denied = SecurityEvent::query()->where('type', 'risk_denied')->sole();
        $this->assertGreaterThanOrEqual(90, $denied->meta['score']);
        $this->assertContains('Signing in from a new country (JP).', $denied->meta['reasons']);
        $this->assertNotEmpty(preg_grep('/km from the last sign in/', $denied->meta['reasons']));
    }

    public function test_the_login_page_offers_the_places_only_with_the_demo_locator()
    {
        $this->get(route('login'))->assertInertia(fn (Assert $page) => $page->where('demoLocation', null));

        config(['keyring.devices.locator' => DemoLocator::class]);

        $this->withCookie(DemoLocator::COOKIE, 'tokyo')->get(route('login'))->assertInertia(fn (Assert $page) => $page
            ->where('demoLocation.current', 'tokyo')
            ->where('demoLocation.places.paris', ['city' => 'Paris', 'country' => 'FR']));
    }

    public function test_picking_a_place_sets_the_cookie()
    {
        $this->post(route('demo-location'), ['place' => 'tokyo'])->assertNotFound();

        config(['keyring.devices.locator' => DemoLocator::class]);

        $this->from(route('login'))->post(route('demo-location'), ['place' => 'tokyo'])
            ->assertRedirect(route('login'))
            ->assertCookie(DemoLocator::COOKIE, 'tokyo');

        $this->post(route('demo-location'), ['place' => 'atlantis'])->assertSessionHasErrors('place');
    }

    private function signInFrom(User $user, string $place): TestResponse
    {
        return $this->withCookie(DemoLocator::COOKIE, $place)
            ->post(route('login.store'), ['email' => $user->email, 'password' => 'password']);
    }

    /**
     * The locator config/keyring.php picks for a KEYRING_LOCATOR.
     */
    private function locatorFor(?string $env): string
    {
        $saved = $_SERVER;
        $_SERVER['KEYRING_LOCATOR'] = $env;

        if ($env === null) {
            unset($_SERVER['KEYRING_LOCATOR']);
        }

        try {
            return (require config_path('keyring.php'))['devices']['locator'];
        } finally {
            $_SERVER = $saved;
        }
    }
}
