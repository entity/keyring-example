<?php

namespace App\Providers;

use App\Actions\Keyring\CreateNewUser;
use App\Actions\Keyring\ResetUserPassword;
use App\Actions\Keyring\UpdateUserPassword;
use App\Actions\Keyring\ValidateEmailChange;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Keyring\Facades\Keyring;
use Keyring\Factors\EmailCode;
use Keyring\Factors\Password;
use Keyring\Factors\RecoveryCodes;
use Keyring\Factors\Totp;
use Keyring\Factors\WebAuthn;
use Keyring\Login\Requirement;
use Keyring\Risk\Action;
use Keyring\Risk\Level;
use Keyring\Risk\Risk;
use Keyring\Risk\Signals\NewDevice;
use Keyring\Risk\Signals\RepeatedFactorFailures;
use Keyring\Risk\Signals\SessionFingerprintChanged;

class KeyringServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Every way people can sign in to the demo.
        Keyring::factors([
            Password::class,
            WebAuthn::passkeys(),
            WebAuthn::securityKeys(),
            Totp::class,
            // NIST doesn't count email as a second factor, so Keyring makes
            // apps opt in to it. The demo shows it anyway.
            EmailCode::asSecondFactor(),
            RecoveryCodes::class,
        ]);

        // Two factors once someone has set one up, and a passkey or security
        // key whenever they have one.
        Keyring::require(Requirement::aal2()->ifEnrolled()->noDowngrade());

        // The account changes are this app's code, in app/Actions/Keyring.
        Keyring::createUsersUsing(CreateNewUser::class);
        Keyring::resetUserPasswordsUsing(ResetUserPassword::class);
        Keyring::updateUserPasswordsUsing(UpdateUserPassword::class);
        Keyring::validateEmailChangesUsing(ValidateEmailChange::class);

        // Registration, password resets and changes, enrollment and emailed links.
        RateLimiter::for('keyring', fn (Request $request) => Limit::perMinute(6)->by(Keyring::guard()->id() ?: $request->ip()));

        // Send every security email. MAIL_MAILER=log writes them to
        // storage/logs/laravel.log, which `composer dev` tails.
        Keyring::notify();

        Keyring::risk([NewDevice::class, RepeatedFactorFailures::class, SessionFingerprintChanged::class])
            ->respond(fn (Risk $risk) => match ($risk->level) {
                Level::Low => Action::allow(),
                Level::Medium => Action::stepUp(),
                Level::High => Action::stepUp()->notify(),
                Level::Critical => Action::deny()->revokeAllSessions()->notify(),
            });

        // Keyring's pages already match the starter kit's names (auth/login,
        // auth/challenge...). Step-up confirmation reuses the challenge page.
        Keyring::page('confirm', 'auth/challenge');
    }
}
