<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use App\Notifications\Keyring\ConfirmEmailChange;
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
