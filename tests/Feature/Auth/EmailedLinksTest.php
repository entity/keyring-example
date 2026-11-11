<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\Keyring\ConfirmEmailChange;
use App\Notifications\Keyring\EmailChangeNotice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Uri;
use Inertia\Testing\AssertableInertia as Assert;
use Keyring\Models\Authenticator;
use Keyring\Models\Device;
use Tests\TestCase;

/**
 * The pages emailed links open. Each link carries a token or a signature in
 * its address, opening it changes nothing, and the page's button posts that
 * secret in the body to an address without it.
 */
class EmailedLinksTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_confirm_link_opens_a_page_that_posts_its_token_in_the_body()
    {
        [$user, $links] = $this->requestEmailChange();
        $confirm = Uri::of($links['confirm']);
        $token = basename($confirm->path());
        $button = '/'.dirname($confirm->path());

        $this->get($links['confirm'])
            ->assertOk()
            ->assertHeader('Referrer-Policy', 'no-referrer')
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/email-change')
                ->where('action', 'confirm')
                ->where('url', $button)
                ->where('token', $token));

        $this->assertSame('old@example.com', $user->fresh()->email);

        // Without the token, or with it in the address, nothing changes.
        $this->post($button)->assertSessionHas('status', 'email-change-invalid');
        $this->assertSame('old@example.com', $user->fresh()->email);

        $this->post($button, ['token' => $token])->assertSessionHas('status', 'email-changed');
        $this->assertSame('new@example.com', $user->fresh()->email);
    }

    public function test_the_undo_link_opens_the_same_page_and_puts_the_old_address_back()
    {
        [$user, $links] = $this->requestEmailChange();
        $confirm = Uri::of($links['confirm']);
        $revert = Uri::of($links['revert']);

        $this->post('/'.dirname($confirm->path()), ['token' => basename($confirm->path())]);
        $this->assertSame('new@example.com', $user->fresh()->email);

        $this->get($links['revert'])
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/email-change')
                ->where('action', 'revert')
                ->where('url', '/'.dirname($revert->path()))
                ->where('token', basename($revert->path())));

        $this->post('/'.dirname($revert->path()), ['token' => basename($revert->path())])
            ->assertRedirect(route('password.request'))
            ->assertSessionHas('status', 'email-change-reverted');

        $this->assertSame('old@example.com', $user->fresh()->email);
    }

    public function test_the_this_wasnt_me_link_opens_a_page_that_posts_its_signature_in_the_body()
    {
        $user = User::factory()->withSecondFactor()->create();
        $device = Device::query()->forceCreate([
            'authenticatable_type' => $user->getMorphClass(),
            'authenticatable_id' => $user->getKey(),
            'token_hash' => hash('sha256', 'a-device-token'),
            'name' => 'Firefox on Windows',
            'first_seen_at' => now(),
            'last_seen_at' => now(),
        ]);

        $link = Uri::of($device->revokeUrl());
        $signed = ['expires' => (string) $link->query()->get('expires'), 'signature' => (string) $link->query()->get('signature')];

        $this->get((string) $link)
            ->assertOk()
            ->assertHeader('Referrer-Policy', 'no-referrer')
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/device-report')
                ->where('device', 'Firefox on Windows')
                ->where('url', '/'.$link->path())
                ->where('expires', $signed['expires'])
                ->where('signature', $signed['signature']));

        $this->assertFalse($device->fresh()->isRevoked());

        // The signature is only read from the body.
        $this->post('/'.$link->path().'?'.http_build_query($signed))->assertForbidden();
        $this->post('/'.$link->path(), [...$signed, 'signature' => 'not-the-signature'])->assertForbidden();
        $this->assertFalse($device->fresh()->isRevoked());

        $this->post('/'.$link->path(), $signed)
            ->assertRedirect(route('login'))
            ->assertSessionHas('status', 'device-reported');

        $this->assertTrue($device->fresh()->isRevoked());
    }

    /**
     * Ask to change the address as a user whose authenticator app is old
     * enough that only the new address has to confirm, and read the links
     * out of the two emails.
     *
     * @return array{User, array{confirm: string, revert: string}}
     */
    private function requestEmailChange(): array
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'old@example.com']);
        $totp = Authenticator::factory()->totp()->default()->for($user, 'authenticatable')->create(['created_at' => now()->subMonth()]);

        $this->actingAs($user)->verifiedWith($totp)
            ->post(route('keyring.email.store'), ['email' => 'new@example.com'])
            ->assertSessionHas('status', 'email-change-requested');

        $links = [];

        Notification::assertSentOnDemand(ConfirmEmailChange::class, function (ConfirmEmailChange $notification) use (&$links) {
            $links['confirm'] = $notification->url;

            return true;
        });

        Notification::assertSentOnDemand(EmailChangeNotice::class, function (EmailChangeNotice $notification) use (&$links) {
            $links['revert'] = $notification->revertUrl;

            return true;
        });

        $this->post(route('logout'));

        return [$user, $links];
    }
}
