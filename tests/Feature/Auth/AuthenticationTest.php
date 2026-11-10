<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Inertia;
use Keyring\Enums\Assurance;
use Keyring\Models\Authenticator;
use Keyring\Testing\VirtualAuthenticator;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered()
    {
        $this->get(route('login'))->assertOk();
    }

    public function test_users_can_authenticate_with_just_a_password()
    {
        $user = User::factory()->create();

        $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password'])
            ->assertRedirect(route('dashboard', absolute: false));

        $this->assertAuthenticatedAs($user);
    }

    public function test_users_can_not_authenticate_with_an_invalid_password()
    {
        $user = User::factory()->create();

        $this->post(route('login.store'), ['email' => $user->email, 'password' => 'wrong-password'])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_users_with_an_authenticator_app_finish_with_a_code()
    {
        $user = User::factory()->create();
        $totp = Authenticator::factory()->totp()->for($user, 'authenticatable')->create();

        $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password'])
            ->assertRedirect(route('keyring.login.challenge', absolute: false));

        $this->assertGuest();

        $this->post(route('keyring.login.verify', 'totp'), ['code' => app(Google2FA::class)->getCurrentOtp($totp->secret)])
            ->assertRedirect(route('dashboard', absolute: false));

        $this->assertAuthenticatedAs($user);
    }

    /**
     * Keyring's pages send no Referer, and Laravel doesn't remember Inertia
     * visits as the previous page on its own. Keyring notes each page it
     * renders, so "back" is the challenge page and not the login page.
     */
    public function test_a_wrong_code_returns_to_the_challenge_page_without_a_referer()
    {
        $user = User::factory()->create();
        Authenticator::factory()->totp()->for($user, 'authenticatable')->create();

        $this->get(route('login'))->assertOk();

        $inertia = ['X-Inertia' => 'true', 'X-Requested-With' => 'XMLHttpRequest', 'X-Inertia-Version' => Inertia::getVersion()];

        $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password'], $inertia);
        $this->get(route('keyring.login.challenge'), $inertia)->assertOk();

        $this->post(route('keyring.login.verify', 'totp'), ['code' => '000000'], $inertia)
            ->assertRedirect(route('keyring.login.challenge'))
            ->assertSessionHasErrors('code');

        $this->assertGuest();
    }

    public function test_users_can_sign_in_with_a_passkey_alone()
    {
        $user = User::factory()->create();
        $key = new VirtualAuthenticator(origin: config('app.url'));

        $this->actingAs($user)->withAssurance(Assurance::AAL1);
        $options = $this->postJson(route('keyring.authenticators.store', 'passkey'))->json('enrollment.options');
        $this->postJson(route('keyring.authenticators.confirm', 'passkey'), ['credential' => $key->register($options)])->assertOk();
        $this->post(route('logout'));

        $options = $this->getJson(route('keyring.login.options', 'passkey'))->json();

        $this->post(route('keyring.login.factor', 'passkey'), ['credential' => $key->assert($options)])
            ->assertRedirect(route('dashboard', absolute: false));

        $this->assertAuthenticatedAs($user);
    }

    public function test_users_are_rate_limited()
    {
        $user = User::factory()->create();

        foreach (range(1, 5) as $attempt) {
            $this->post(route('login.store'), ['email' => $user->email, 'password' => 'wrong-password']);
        }

        $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password'])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_users_can_logout()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('logout'))->assertRedirect('/');

        $this->assertGuest();
    }
}
