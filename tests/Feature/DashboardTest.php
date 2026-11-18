<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\DemoLocator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Keyring\Devices\HeaderLocator;
use Keyring\Models\Authenticator;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $user = User::factory()->withSecondFactor()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }

    /**
     * Some of the things to try depend on how the app was started.
     */
    public function test_the_dashboard_says_which_demo_settings_are_on()
    {
        $this->actingAs(User::factory()->withSecondFactor()->create());

        $this->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('demoSettings', [
                'locator' => null,
                'breachCheck' => ['signIns' => false, 'newPasswords' => false],
                'emailPreviews' => false,
            ]));

        config(['keyring.devices.locator' => DemoLocator::class, 'keyring.passwords.uncompromised' => true]);

        $this->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page
            ->where('demoSettings.locator', 'demo')
            ->where('demoSettings.breachCheck', ['signIns' => true, 'newPasswords' => true]));

        config(['keyring.devices.locator' => HeaderLocator::class]);

        $this->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page->where('demoSettings.locator', 'cloudflare'));
    }

    /**
     * Left unset, Keyring checks new passwords in production, but sign ins
     * are only checked when the setting says so.
     */
    public function test_the_breach_check_card_tells_new_passwords_from_sign_ins()
    {
        $this->actingAs(User::factory()->withSecondFactor()->create());
        $this->app['env'] = 'production';
        // Unset, as the app ships. Nothing here calls the API.
        config(['keyring.passwords.uncompromised' => null]);

        $this->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page
            ->where('demoSettings.breachCheck', ['signIns' => false, 'newPasswords' => true]));

        config(['keyring.passwords.uncompromised' => false]);

        $this->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page
            ->where('demoSettings.breachCheck', ['signIns' => false, 'newPasswords' => false]));
    }

    /**
     * Everyone needs a second factor (the keyring.enrolled middleware), so
     * until they have one every page sends them to where they add it.
     */
    public function test_users_without_a_second_factor_are_sent_to_add_one()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get(route('dashboard'))
            ->assertRedirect(route('security.edit', absolute: false))
            ->assertSessionHas('status', 'enroll-first');

        $this->actingAs($user)->getJson(route('dashboard'))
            ->assertForbidden()
            ->assertJson(['status' => 'enroll-first', 'redirect' => '/settings/security']);
    }

    /**
     * An emailed code is a step at sign in, not a second factor, and
     * recovery codes are only a way back in.
     */
    public function test_an_emailed_code_is_not_the_second_factor_everyone_needs()
    {
        $user = User::factory()->create();
        Authenticator::factory()->emailCode()->for($user, 'authenticatable')->create();

        $this->actingAs($user)->get(route('dashboard'))
            ->assertRedirect(route('security.edit', absolute: false));
    }

    public function test_the_public_pages_stay_open_to_someone_who_still_has_to_add_one()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get(route('home'))->assertOk();
        $this->actingAs($user)->get(route('well-known.passkeys'))->assertOk();
    }
}
