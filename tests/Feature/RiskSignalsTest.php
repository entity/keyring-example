<?php

namespace Tests\Feature;

use App\Models\User;
use App\Providers\KeyringServiceProvider;
use Illuminate\Contracts\Validation\UncompromisedVerifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Keyring\Facades\Keyring;
use Keyring\Models\PendingChange;
use Keyring\Models\SecurityEvent;
use Keyring\Risk\Checkpoint;
use Keyring\Risk\Signals;
use ReflectionProperty;
use Tests\TestCase;

class RiskSignalsTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_demo_runs_every_signal_that_needs_no_network_call()
    {
        $this->assertSame([
            Signals\NewDevice::class,
            Signals\RepeatedFactorFailures::class,
            Signals\InactiveAccount::class,
            Signals\SuccessAfterFailures::class,
            Signals\RecentlyChangedRecovery::class,
            Signals\NewCountry::class,
            Signals\ImpossibleTravel::class,
        ], $this->signalsAt(Checkpoint::Login));

        $this->assertSame([Signals\SessionFingerprintChanged::class], $this->signalsAt(Checkpoint::Request));
    }

    /**
     * Unset keeps Keyring's default (null), which checks new passwords in
     * production only.
     */
    public function test_the_breach_check_keeps_keyrings_default_unless_its_set()
    {
        $this->assertNull($this->keyringConfig()['passwords']['uncompromised']);
        $this->assertNull($this->keyringConfig(['BREACHED_PASSWORD_CHECK' => ''])['passwords']['uncompromised']);
        $this->assertTrue($this->keyringConfig(['BREACHED_PASSWORD_CHECK' => 'true'])['passwords']['uncompromised']);
        $this->assertFalse($this->keyringConfig(['BREACHED_PASSWORD_CHECK' => 'false'])['passwords']['uncompromised']);
        $this->assertFalse($this->keyringConfig(['BREACHED_PASSWORD_CHECK' => 'true'])['passwords']['refuse_unchecked']);
        $this->assertTrue($this->keyringConfig(['BREACHED_PASSWORD_REFUSE_UNCHECKED' => 'true'])['passwords']['refuse_unchecked']);
    }

    public function test_the_breach_check_also_checks_every_password_sign_in()
    {
        $this->checkBreachedPasswords();

        $this->assertContains(Signals\BreachedPassword::class, $this->signalsAt(Checkpoint::Login));
    }

    /**
     * Keyring's default only checks new passwords, and only in production,
     * so sign ins aren't checked unless the setting says true.
     */
    public function test_sign_ins_are_only_checked_when_the_setting_is_true()
    {
        foreach ([null, false] as $setting) {
            config(['keyring.passwords.uncompromised' => $setting]);
            new KeyringServiceProvider($this->app)->boot();

            $this->assertNotContains(Signals\BreachedPassword::class, $this->signalsAt(Checkpoint::Login));
        }
    }

    /**
     * The scores add up, and 90 refuses the sign in. Whatever is true of
     * the owner's own sign in (a new device, in a new country, after 90
     * quiet days or a week after changing the address), a stranger typing
     * wrong passwords mustn't be able to take it to 90. The address can't
     * have changed during the quiet days, so only the larger of the two
     * counts. Impossible travel and a new country together still refuse.
     */
    public function test_a_stranger_cant_add_enough_to_refuse_the_owner()
    {
        $score = $this->scores();

        $owner = $score[Signals\NewDevice::class]
            + $score[Signals\NewCountry::class]
            + max($score[Signals\InactiveAccount::class], $score[Signals\RecentlyChangedRecovery::class]);

        $this->assertLessThan(90, $owner + $score[Signals\SuccessAfterFailures::class]);
        $this->assertGreaterThanOrEqual(90, $score[Signals\NewCountry::class] + $score[Signals\ImpossibleTravel::class]);
    }

    /**
     * In the week after the address changed, a sign in from a new browser
     * (15) with the change (25) is asked for more, and the activity says
     * why.
     */
    public function test_a_sign_in_after_an_email_change_counts_the_change()
    {
        $user = User::factory()->create(['email' => 'new@example.com']);
        $change = new PendingChange([
            'attribute' => 'email',
            'value' => 'new@example.com',
            'previous_value' => 'old@example.com',
            'confirm_token' => PendingChange::hashToken('confirm'),
            'revert_token' => PendingChange::hashToken('revert'),
            'expires_at' => now()->subDays(2),
            'applied_at' => now()->subDays(3),
            'revertable_until' => now()->addDays(4),
        ]);
        $change->authenticatable()->associate($user)->save();

        $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password']);

        $this->assertAuthenticatedAs($user);
        $assessed = SecurityEvent::query()->where('type', 'risk_step_up')->sole();
        $this->assertSame(40, $assessed->meta['score']);
        $this->assertContains('The email address changed recently.', $assessed->meta['reasons']);
    }

    /**
     * The sign in goes ahead, and the user is held on the security page
     * (keyring.password_change_url) until they've chosen another password.
     */
    public function test_a_password_found_in_a_breach_has_to_be_changed()
    {
        $this->checkBreachedPasswords();
        $this->app->instance(UncompromisedVerifier::class, new class implements UncompromisedVerifier
        {
            public function verify($data)
            {
                return false;
            }
        });
        $user = User::factory()->create();

        $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password']);

        $this->assertAuthenticatedAs($user);
        $this->assertTrue(Keyring::requiresPasswordChange($user));
        $this->get(route('dashboard'))->assertRedirect('/settings/security');
    }

    /**
     * Each login signal's score, as the app registers it.
     *
     * @return array<class-string, int>
     */
    private function scores(): array
    {
        $scores = [];

        foreach (Keyring::risk()->signalsFor(Checkpoint::Login) as $signal) {
            $scores[$signal::class] = (new ReflectionProperty($signal, 'score'))->getValue($signal);
        }

        return $scores;
    }

    /**
     * Boot the app's Keyring setup again, as with BREACHED_PASSWORD_CHECK set.
     */
    private function checkBreachedPasswords(): void
    {
        config(['keyring.passwords.uncompromised' => true]);

        new KeyringServiceProvider($this->app)->boot();
    }

    /**
     * @return list<class-string>
     */
    private function signalsAt(Checkpoint $checkpoint): array
    {
        return array_map(fn (object $signal) => $signal::class, Keyring::risk()->signalsFor($checkpoint));
    }

    /**
     * config/keyring.php as it reads with these environment variables set.
     *
     * @param  array<string, string>  $env
     * @return array<string, mixed>
     */
    private function keyringConfig(array $env = []): array
    {
        $saved = $_SERVER;
        $_SERVER = [...$_SERVER, ...$env];

        try {
            return require config_path('keyring.php');
        } finally {
            $_SERVER = $saved;
        }
    }
}
