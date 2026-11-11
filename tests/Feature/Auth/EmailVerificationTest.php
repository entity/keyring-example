<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

/**
 * How verification goes in this app, where registering signs nobody in:
 * the emailed link and the password together verify an address, and an
 * account that isn't verified is never signed in. RegistrationTest follows
 * the whole flow from the form.
 */
class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_opening_the_emailed_link_signed_out_verifies_nothing_and_asks_to_sign_in()
    {
        $user = User::factory()->unverified()->create();

        Event::fake([Verified::class]);

        $this->get($this->verificationLink($user))
            ->assertRedirect(route('login'))
            ->assertSessionHas('status', 'sign-in-to-verify');

        Event::assertNotDispatched(Verified::class);
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_signing_in_from_the_browser_that_followed_the_link_verifies_the_address()
    {
        $user = User::factory()->unverified()->create();

        Event::fake([Verified::class]);

        $this->get($this->verificationLink($user));

        $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password'])
            ->assertRedirect($this->verificationLink($user));

        Event::assertDispatched(Verified::class);
        $this->assertAuthenticatedAs($user);
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
    }

    public function test_someone_elses_link_does_not_let_an_unverified_account_sign_in()
    {
        $user = User::factory()->unverified()->create();
        $other = User::factory()->unverified()->create();

        $this->get($this->verificationLink($other));

        $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password'])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_a_link_with_a_bad_signature_is_refused()
    {
        $user = User::factory()->unverified()->create();

        $this->get($this->verificationLink($user).'tampered')->assertForbidden();

        $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password'])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    /**
     * A session whose account isn't verified (it lost its verification, or
     * the app signed it in some other way) ends on its next request.
     */
    public function test_an_unverified_account_is_not_left_signed_in()
    {
        $user = User::factory()->unverified()->withSecondFactor()->create();

        $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('login'));

        $this->assertGuest();
    }

    public function test_a_verified_user_who_opens_their_link_again_is_sent_on()
    {
        $user = User::factory()->withSecondFactor()->create();

        Event::fake([Verified::class]);

        $this->actingAs($user)->get($this->verificationLink($user))
            ->assertRedirect(route('dashboard', absolute: false));

        Event::assertNotDispatched(Verified::class);
    }

    private function verificationLink(User $user): string
    {
        return URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)],
            absolute: false, // Keyring checks relative signatures
        );
    }
}
