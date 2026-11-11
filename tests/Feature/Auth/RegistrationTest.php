<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\Keyring\AlreadyRegistered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Registering answers the same whether or not the address has an account
 * (keyring.registration.reveal_taken is off, the default), so nobody is
 * signed in by it: a new user verifies their address first.
 */
class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered()
    {
        $response = $this->get(route('register'));

        $response->assertOk();
    }

    public function test_new_users_are_told_to_check_their_email_and_are_not_signed_in()
    {
        Notification::fake();

        $this->register('test@example.com')
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('login'))
            ->assertSessionHas('status', 'registration-received');

        $this->assertGuest();

        $user = User::query()->sole();

        // Hashed once: by the action, and left alone by the model's cast.
        $this->assertTrue(Hash::check('a-long-new-passphrase', $user->password));
        $this->assertFalse($user->hasVerifiedEmail());

        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_the_login_page_shows_the_check_your_email_message()
    {
        Notification::fake();

        $this->register('test@example.com');

        $this->get(route('login'))->assertInertia(fn (Assert $page) => $page
            ->component('auth/login')
            ->where('status', __('keyring::status.registration-received')));
    }

    public function test_an_address_that_has_an_account_gets_the_same_answer_and_an_email()
    {
        Notification::fake();
        $existing = User::factory()->create(['email' => 'taken@example.com']);

        $this->register('taken@example.com')
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('login'))
            ->assertSessionHas('status', 'registration-received');

        $this->assertGuest();
        $this->assertSame(1, User::query()->count());

        Notification::assertSentOnDemand(AlreadyRegistered::class, fn (AlreadyRegistered $notification, array $channels, object $notifiable) => $notifiable->routes['mail'] === 'taken@example.com'
            && $notification->loginUrl === route('login')
            && $notification->resetUrl === route('password.request'));
        Notification::assertNothingSentTo($existing);
    }

    public function test_an_unverified_account_cant_sign_in_with_just_its_password()
    {
        Notification::fake();

        $this->register('test@example.com');

        $this->post(route('login.store'), ['email' => 'test@example.com', 'password' => 'a-long-new-passphrase'])
            ->assertSessionHasErrors(['email' => __('auth.failed')]);

        $this->assertGuest();
    }

    /**
     * The emailed link and the password together: the link alone verifies
     * nothing, and sends a signed-out browser to sign in.
     */
    public function test_following_the_emailed_link_and_signing_in_verifies_the_address()
    {
        Notification::fake();
        Event::fake([Verified::class]);

        $this->register('test@example.com');
        $user = User::query()->sole();

        $this->get($this->verificationLink($user))
            ->assertRedirect(route('login'))
            ->assertSessionHas('status', 'sign-in-to-verify');

        $this->assertFalse($user->fresh()->hasVerifiedEmail());

        $this->get(route('login'))->assertInertia(fn (Assert $page) => $page
            ->where('status', __('keyring::status.sign-in-to-verify')));

        $this->post(route('login.store'), ['email' => 'test@example.com', 'password' => 'a-long-new-passphrase'])
            ->assertSessionHasNoErrors();

        $this->assertAuthenticatedAs($user);
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        Event::assertDispatched(Verified::class);
    }

    /**
     * Everyone needs a second factor, so the first page a new user reaches
     * is the one where they add it.
     */
    public function test_a_newly_verified_user_is_sent_to_add_a_second_factor()
    {
        Notification::fake();

        $this->register('test@example.com');
        $user = User::query()->sole();

        $this->get($this->verificationLink($user));
        $this->post(route('login.store'), ['email' => 'test@example.com', 'password' => 'a-long-new-passphrase']);

        $this->get(route('dashboard'))
            ->assertRedirect(route('security.edit', absolute: false))
            ->assertSessionHas('status', 'enroll-first');
    }

    private function register(string $email): TestResponse
    {
        return $this->post(route('register.store'), [
            'name' => 'Test User',
            'email' => $email,
            'password' => 'a-long-new-passphrase',
            'password_confirmation' => 'a-long-new-passphrase',
        ]);
    }

    /**
     * The link in the verification email Keyring had Laravel send.
     */
    private function verificationLink(User $user): string
    {
        $link = null;

        Notification::assertSentTo($user, VerifyEmail::class, function (VerifyEmail $notification) use ($user, &$link) {
            $link = $notification->toMail($user)->actionUrl;

            return true;
        });

        return $link;
    }
}
