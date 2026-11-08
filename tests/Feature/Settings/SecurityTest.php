<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Keyring\Enums\Assurance;
use Keyring\Models\Authenticator;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_security_page_needs_a_recent_verification()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->freshAt(now()->subHour())
            ->get(route('security.edit'))
            ->assertRedirect(route('keyring.confirm.challenge'));
    }

    public function test_security_page_shows_sign_in_methods_and_devices()
    {
        $user = User::factory()->create();
        $totp = Authenticator::factory()->totp()->for($user, 'authenticatable')->create(['name' => '1Password']);

        $this->actingAs($user)->withAssurance(Assurance::AAL2)
            ->get(route('security.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/security')
                ->where('authenticators.0.id', $totp->id)
                ->where('authenticators.0.name', '1Password')
                ->where('assurance', 'AAL2')
                ->has('enrollable')
                ->has('devices')
                ->has('activity'));
    }

    public function test_password_can_be_updated()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->withAssurance(Assurance::AAL1)
            ->from(route('security.edit'))
            ->put(route('user-password.update'), [
                'current_password' => 'password',
                'password' => 'a-long-new-passphrase',
                'password_confirmation' => 'a-long-new-passphrase',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('security.edit'));

        $this->assertTrue(Hash::check('a-long-new-passphrase', $user->refresh()->password));
    }

    public function test_correct_password_must_be_provided_to_update_password()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->withAssurance(Assurance::AAL1)
            ->from(route('security.edit'))
            ->put(route('user-password.update'), [
                'current_password' => 'wrong-password',
                'password' => 'a-long-new-passphrase',
                'password_confirmation' => 'a-long-new-passphrase',
            ])
            ->assertSessionHasErrors('current_password');
    }
}
