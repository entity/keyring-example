<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\Keyring\VerificationCode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Keyring\Enums\Assurance;
use Keyring\Models\Authenticator;
use Keyring\Sessions\SessionAssurance;
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

    /**
     * Someone with nothing else signs in with their password. The dashboard
     * then sends them to add a second factor: see DashboardTest.
     */
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
     * Some browsers send no Referer at all, and Laravel doesn't remember
     * Inertia visits as the previous page on its own. Keyring notes each page
     * it renders, so "back" is the challenge page and not the login page.
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

    /**
     * An emailed code is asked for after the password when it's all the
     * account has, and leaves the session at AAL1: it's a step, not a
     * second factor, so the user is still sent to add one.
     */
    public function test_an_emailed_code_is_a_sign_in_step_that_leaves_the_session_at_aal1()
    {
        Notification::fake();
        $user = User::factory()->create();
        Authenticator::factory()->emailCode()->for($user, 'authenticatable')->create();

        $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password'])
            ->assertRedirect(route('keyring.login.challenge', absolute: false));

        $this->post(route('keyring.login.send', 'email-code'));

        $code = null;
        Notification::assertSentTo($user, VerificationCode::class, function (VerificationCode $notification) use (&$code) {
            $code = $notification->code;

            return true;
        });

        $this->post(route('keyring.login.verify', 'email-code'), ['code' => $code])
            ->assertRedirect(route('dashboard', absolute: false));

        $this->assertAuthenticatedAs($user);
        $this->assertSame(Assurance::AAL1, app(SessionAssurance::class)->level());

        $this->get(route('dashboard'))->assertRedirect(route('security.edit', absolute: false));
    }

    public function test_users_can_sign_in_with_a_passkey_alone()
    {
        $user = User::factory()->create();
        $key = new VirtualAuthenticator(origin: config('app.url'));

        $this->actingAs($user)->withAssurance(Assurance::AAL1);
        $options = $this->postJson(route('keyring.authenticators.store', 'passkey'))->json('enrollment.options');
        $this->postJson(route('keyring.authenticators.confirm', 'passkey'), ['credential' => $key->register($options)])->assertOk();
        $this->post(route('logout'));

        $options = $this->getJson(route('keyring.login.options', 'passkey'))->json('options');

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
