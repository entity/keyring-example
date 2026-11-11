<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Session\ArraySessionHandler;
use Illuminate\Session\Store;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Keyring\Enums\Assurance;
use Keyring\Facades\Keyring;
use Keyring\Models\Authenticator;
use Keyring\Sessions\RegisteredSession;
use Keyring\Sessions\Sessions;
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
                ->where('hasSecondFactor', true)
                ->where('mustChangePassword', false)
                ->has('enrollable')
                ->has('devices')
                ->has('sessions', 1)
                ->has('activity'));
    }

    public function test_security_page_lists_every_session()
    {
        $user = User::factory()->withSecondFactor()->create();

        $elsewhere = $this->signedInElsewhere($user, ['REMOTE_ADDR' => '203.0.113.7', 'HTTP_USER_AGENT' => 'Mozilla/5.0 (Windows NT 10.0; rv:130.0) Gecko/20100101 Firefox/130.0']);

        // The list is most recently active first, and this session is.
        $this->travel(5)->minutes();

        $this->actingAs($user)->withAssurance(Assurance::AAL2)
            ->get(route('security.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('sessions', 2)
                ->where('sessions.0.current', true)
                ->where('sessions.1.current', false)
                ->where('sessions.1.name', 'Firefox on Windows')
                ->where('sessions.1.ip', '203.0.113.7')
                // A handle for DELETE /user/sessions/{id}, never the record's own ID.
                ->where('sessions.1.id', fn (string $handle) => $handle !== $elsewhere->id && strlen($handle) === 64));
    }

    public function test_one_session_can_be_ended_by_its_handle()
    {
        $user = User::factory()->withSecondFactor()->create();
        $sessions = app(Sessions::class);
        $elsewhere = $this->signedInElsewhere($user);

        $this->actingAs($user)->withAssurance(Assurance::AAL2)
            ->deleteJson(route('keyring.sessions.destroy', $sessions->handle($elsewhere)))
            ->assertOk()
            ->assertJson(['status' => 'session-revoked']);

        $this->assertNotNull($sessions->registry()->find($elsewhere->id)?->revokedAt);
        $this->assertAuthenticatedAs($user);
    }

    public function test_signing_out_other_sessions_keeps_this_one()
    {
        $user = User::factory()->withSecondFactor()->create();
        $sessions = app(Sessions::class);
        $elsewhere = $this->signedInElsewhere($user);

        $this->actingAs($user)->withAssurance(Assurance::AAL2)
            ->deleteJson(route('keyring.sessions.destroy-others'))
            ->assertOk()
            ->assertJson(['status' => 'sessions-revoked']);

        $this->assertNotNull($sessions->registry()->find($elsewhere->id)?->revokedAt);
        $this->assertAuthenticatedAs($user);
        $this->assertCount(1, $sessions->active($user));
    }

    /**
     * The checkbox next to the sign-in methods: Keyring only ends the other
     * sessions with a change when the request asks.
     */
    public function test_removing_a_sign_in_method_can_sign_out_the_other_sessions()
    {
        $user = User::factory()->withSecondFactor()->create();
        $extra = Authenticator::factory()->totp()->for($user, 'authenticatable')->create(['name' => 'Old phone']);
        $sessions = app(Sessions::class);
        $kept = $this->signedInElsewhere($user);

        $this->actingAs($user)->withAssurance(Assurance::AAL2)
            ->deleteJson(route('keyring.authenticators.destroy', $extra), ['sign_out_others' => false])
            ->assertOk();

        $this->assertNull($sessions->registry()->find($kept->id)?->revokedAt);

        $another = Authenticator::factory()->totp()->for($user, 'authenticatable')->create(['name' => 'Older phone']);

        $this->deleteJson(route('keyring.authenticators.destroy', $another), ['sign_out_others' => true])
            ->assertOk();

        $this->assertNotNull($sessions->registry()->find($kept->id)?->revokedAt);
        $this->assertAuthenticatedAs($user);
    }

    /**
     * Changing sign-in methods takes the strongest proof the account has.
     * With a security key that's the key: a password and an authenticator
     * app's code aren't enough.
     */
    public function test_someone_with_a_security_key_has_to_use_it_to_reach_the_security_page()
    {
        $user = User::factory()->create();
        $totp = Authenticator::factory()->totp()->default()->for($user, 'authenticatable')->create();
        $key = Authenticator::factory()->securityKey()->for($user, 'authenticatable')->create(['name' => 'YubiKey']);

        $this->actingAs($user)->verifiedWith($totp)
            ->get(route('security.edit'))
            ->assertRedirect(route('keyring.confirm.challenge'));

        $this->get(route('keyring.confirm.challenge'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/challenge')
                ->where('purpose', 'confirm')
                ->where('factor', 'security-key')
                ->where('authenticator.name', 'YubiKey'));

        $this->postJson(route('keyring.authenticators.store', 'totp'))->assertStatus(423);
        $this->deleteJson(route('keyring.authenticators.destroy', $totp))->assertStatus(423);

        $this->actingAs($user)->verifiedWith($key)
            ->get(route('security.edit'))
            ->assertOk();
    }

    public function test_the_page_says_when_a_second_factor_is_still_needed()
    {
        $user = User::factory()->create();
        $emailCode = Authenticator::factory()->emailCode()->for($user, 'authenticatable')->create();

        // Getting in takes what the account has: the password and a code.
        $this->actingAs($user)->verifiedWith($emailCode)
            ->get(route('security.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('hasSecondFactor', false));

        Authenticator::factory()->totp()->for($user, 'authenticatable')->create();

        $this->actingAs($user->fresh())->withAssurance(Assurance::AAL2)
            ->get(route('security.edit'))
            ->assertInertia(fn (Assert $page) => $page->where('hasSecondFactor', true));
    }

    /**
     * Keyring::requirePasswordChange() holds the user on this page, which is
     * keyring.password_change_url, until the password changes.
     */
    public function test_a_user_who_must_change_their_password_is_held_on_the_security_page()
    {
        $user = User::factory()->withSecondFactor()->create();
        Keyring::requirePasswordChange($user, 'Reported phished.');

        $this->actingAs($user)->withAssurance(Assurance::AAL2)
            ->get(route('dashboard'))
            ->assertRedirect('/settings/security')
            ->assertSessionHas('status', 'change-password');

        $this->get(route('security.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('mustChangePassword', true)
                ->where('statusMessage', __('keyring::status.change-password')));

        $this->from(route('security.edit'))
            ->put(route('user-password.update'), [
                'current_password' => 'password',
                'password' => 'a-long-new-passphrase',
                'password_confirmation' => 'a-long-new-passphrase',
            ])
            ->assertSessionHasNoErrors();

        $this->assertFalse(Keyring::requiresPasswordChange($user->refresh()));
        $this->get(route('dashboard'))->assertOk();
    }

    /**
     * The account signed in from another browser, with a session of its own.
     *
     * @param  array<string, string>  $server
     */
    private function signedInElsewhere(User $user, array $server = []): RegisteredSession
    {
        $request = Request::create('/', server: $server);
        $request->setLaravelSession(new Store('elsewhere', new ArraySessionHandler(120)));

        return app(Sessions::class)->start($request, $user, null, Assurance::AAL2);
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
