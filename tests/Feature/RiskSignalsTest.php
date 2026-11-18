<?php

namespace Tests\Feature;

use App\Models\User;
use App\Providers\KeyringServiceProvider;
use Illuminate\Contracts\Validation\UncompromisedVerifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Keyring\Facades\Keyring;
use Keyring\Risk\Checkpoint;
use Keyring\Risk\Signals;
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

    public function test_the_breach_check_is_off_unless_its_setting_is_on()
    {
        $this->assertFalse($this->keyringConfig()['passwords']['uncompromised']);
        $this->assertFalse($this->keyringConfig(['BREACHED_PASSWORD_CHECK' => 'true'])['passwords']['refuse_unchecked']);
        $this->assertTrue($this->keyringConfig(['BREACHED_PASSWORD_CHECK' => 'true'])['passwords']['uncompromised']);
        $this->assertTrue($this->keyringConfig(['BREACHED_PASSWORD_REFUSE_UNCHECKED' => 'true'])['passwords']['refuse_unchecked']);
    }

    public function test_the_breach_check_also_checks_every_password_sign_in()
    {
        $this->checkBreachedPasswords();

        $this->assertContains(Signals\BreachedPassword::class, $this->signalsAt(Checkpoint::Login));
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
