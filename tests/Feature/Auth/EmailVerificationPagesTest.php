<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Uri;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * The two pages for a user who is signed in before verifying their address:
 * auth/verify-email ("check your inbox") and auth/email-verification (where
 * the emailed link lands, with a button).
 *
 * This app's registration never signs such a user in, so nobody reaches
 * them as it's configured. They're here for an app that turns on
 * keyring.registration.reveal_taken, which these tests do: with it, a new
 * user is signed in straight away and verifies from inside.
 */
class EmailVerificationPagesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['keyring.registration.reveal_taken' => true]);
    }

    public function test_email_verification_screen_can_be_rendered()
    {
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)->get(route('verification.notice'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('auth/verify-email'));
    }

    public function test_unverified_users_are_redirected_to_the_email_verification_prompt(): void
    {
        $user = User::factory()->unverified()->withSecondFactor()->create();

        $this->actingAs($user)->get(route('appearance.edit'))
            ->assertRedirect(route('verification.notice'));
    }

    public function test_verified_user_is_redirected_to_dashboard_from_verification_prompt(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get(route('verification.notice'))
            ->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_sends_verification_notification(): void
    {
        Notification::fake();

        $user = User::factory()->unverified()->create();

        $this->actingAs($user)
            ->from(route('verification.notice'))
            ->post(route('verification.send'))
            ->assertRedirect(route('verification.notice'))
            ->assertSessionHas('status', 'verification-link-sent');

        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_does_not_send_verification_notification_if_email_is_verified(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('verification.send'))
            ->assertRedirect(route('dashboard', absolute: false));

        Notification::assertNothingSent();
    }

    /**
     * Opening the link changes nothing: it shows a page whose button posts
     * the link's signature in the body, to the link's path.
     */
    public function test_the_emailed_link_opens_a_page_with_a_button()
    {
        $user = User::factory()->unverified()->create();
        $link = Uri::of($this->verificationLink($user));

        Event::fake([Verified::class]);

        $this->actingAs($user)->get((string) $link)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/email-verification')
                ->where('email', $user->email)
                ->where('url', '/'.$link->path())
                ->where('expires', (string) $link->query()->get('expires'))
                ->where('signature', $link->query()->get('signature')));

        Event::assertNotDispatched(Verified::class);
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_the_pages_button_verifies_the_address()
    {
        $user = User::factory()->unverified()->create();

        Event::fake([Verified::class]);

        $this->actingAs($user)->post(...$this->button($this->verificationLink($user)))
            ->assertRedirect(route('dashboard', absolute: false).'?verified=1');

        Event::assertDispatched(Verified::class);
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
    }

    public function test_the_signature_is_only_read_from_the_body()
    {
        $user = User::factory()->unverified()->create();

        // The whole link as the form's address, as the page used to post it.
        $this->actingAs($user)->post($this->verificationLink($user))->assertForbidden();

        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_email_is_not_verified_with_invalid_hash()
    {
        $user = User::factory()->unverified()->create();

        Event::fake([Verified::class]);

        $this->actingAs($user)->post(...$this->button($this->verificationLink($user, hash: sha1('wrong-email'))))
            ->assertForbidden();

        Event::assertNotDispatched(Verified::class);
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_email_is_not_verified_with_invalid_user_id(): void
    {
        $user = User::factory()->unverified()->create();

        Event::fake([Verified::class]);

        $this->actingAs($user)->post(...$this->button($this->verificationLink($user, id: 123)))
            ->assertForbidden();

        Event::assertNotDispatched(Verified::class);
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    private function verificationLink(User $user, ?int $id = null, ?string $hash = null): string
    {
        return URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $id ?? $user->id, 'hash' => $hash ?? sha1($user->email)],
            absolute: false, // Keyring checks relative signatures
        );
    }

    /**
     * What the page's button posts for a link: its path, with the expiry
     * and signature from its query string in the body.
     *
     * @return array{string, array{expires: string, signature: string}}
     */
    private function button(string $link): array
    {
        $link = Uri::of($link);

        return ['/'.$link->path(), [
            'expires' => (string) $link->query()->get('expires'),
            'signature' => (string) $link->query()->get('signature'),
        ]];
    }
}
