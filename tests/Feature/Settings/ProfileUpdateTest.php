<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use App\Notifications\Keyring\ConfirmEmailChange;
use App\Notifications\Keyring\EmailChangeNotice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Keyring\Enums\Assurance;
use Keyring\Models\Authenticator;
use Tests\TestCase;

class ProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get(route('profile.edit'))->assertOk();
    }

    public function test_the_name_can_be_updated_but_not_the_email()
    {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $this->actingAs($user)
            ->patch(route('profile.update'), ['name' => 'Test User', 'email' => 'other@example.com'])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('profile.edit'));

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
    }

    public function test_changing_the_email_sends_a_confirmation_to_the_new_address()
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'test@example.com']);

        $this->actingAs($user)->withAssurance(Assurance::AAL1)
            ->post(route('keyring.email.store'), ['email' => 'new@example.com'])
            ->assertSessionHas('status', 'email-change-requested');

        Notification::assertSentOnDemand(ConfirmEmailChange::class, fn ($notification, $channels, $notifiable) => $notifiable->routes['mail'] === 'new@example.com');
        $this->assertSame('test@example.com', $user->refresh()->email);
    }

    /**
     * A second factor the account has had for a while
     * (keyring.email_changes.established_after, a week by default) is proof
     * enough, so the old address only gets the link to undo the change.
     */
    public function test_an_established_second_factor_skips_the_old_address_confirmation()
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'test@example.com']);
        $totp = Authenticator::factory()->totp()->for($user, 'authenticatable')->create(['created_at' => now()->subMonth()]);

        $this->actingAs($user)->verifiedWith($totp)
            ->post(route('keyring.email.store'), ['email' => 'new@example.com'])
            ->assertSessionHas('status', 'email-change-requested');

        Notification::assertSentOnDemand(EmailChangeNotice::class, fn (EmailChangeNotice $notice, $channels, $notifiable) => $notifiable->routes['mail'] === 'test@example.com' && $notice->confirmUrl === null);
    }

    /**
     * A newer one could have been added by whoever got in, so the old address
     * has to confirm as well.
     */
    public function test_a_new_second_factor_still_needs_the_old_address_to_confirm()
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'test@example.com']);
        $totp = Authenticator::factory()->totp()->for($user, 'authenticatable')->create(['created_at' => now()->subDay()]);

        $this->actingAs($user)->verifiedWith($totp)
            ->post(route('keyring.email.store'), ['email' => 'new@example.com'])
            ->assertSessionHas('status', 'email-change-requested');

        Notification::assertSentOnDemand(EmailChangeNotice::class, fn (EmailChangeNotice $notice, $channels, $notifiable) => $notifiable->routes['mail'] === 'test@example.com' && $notice->confirmUrl !== null);
    }

    public function test_the_two_factor_demo_account_is_seeded_with_an_established_second_factor()
    {
        Notification::fake();
        $this->seed();

        $user = User::query()->where('email', '2fa@keyring.test')->sole();
        $totp = $user->authenticators()->where('factor', 'totp')->sole();

        $this->actingAs($user)->verifiedWith($totp)
            ->post(route('keyring.email.store'), ['email' => 'new@example.com'])
            ->assertSessionHas('status', 'email-change-requested');

        Notification::assertSentOnDemand(EmailChangeNotice::class, fn (EmailChangeNotice $notice) => $notice->confirmUrl === null);
    }

    public function test_deleting_the_account_needs_a_recent_verification()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->freshAt(now()->subHour())
            ->delete(route('profile.destroy'))
            ->assertRedirect(route('keyring.confirm.challenge'));

        $this->assertNotNull($user->fresh());
    }

    public function test_user_can_delete_their_account()
    {
        $user = User::factory()->create();
        Authenticator::factory()->totp()->for($user, 'authenticatable')->create();

        $this->actingAs($user)->withAssurance(Assurance::AAL2)
            ->delete(route('profile.destroy'))
            ->assertRedirect('/');

        $this->assertGuest();
        $this->assertNull($user->fresh());
        $this->assertSame(0, Authenticator::count());
    }
}
