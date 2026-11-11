<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
