<?php

declare(strict_types=1);

namespace App\Providers;

use App\Actions\Keyring\CreateNewUser;
use App\Actions\Keyring\ResetUserPassword;
use App\Actions\Keyring\UpdateUserPassword;
use App\Actions\Keyring\ValidateEmailChange;
use App\Notifications\Keyring as Notifications;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Contracts\Http\Kernel;
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
use Keyring\Risk\Signals\InactiveAccount;
use Keyring\Risk\Signals\NewDevice;
use Keyring\Risk\Signals\RepeatedFactorFailures;
use Keyring\Risk\Signals\SessionFingerprintChanged;
use Keyring\Risk\Signals\SuccessAfterFailures;

class KeyringServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Every way people can sign in to the demo.
        Keyring::factors([
            Password::class,
            WebAuthn::passkeys(),
            $this->securityKeys(),
            // A code only works during its own 30 seconds, which is what
            // OWASP ASVS 6.5.5 asks. Keyring's default also takes the code
            // before and the one after, for a phone whose clock is off.
            fn (Application $app) => $app->make(Totp::class, ['window' => 0]),
            // An emailed code is a step at sign in, not a second factor:
            // whoever reads the inbox can reset the password too. A password
            // and a code is still AAL1, and doesn't count as having a second
            // factor. Keyring makes apps opt in, and the demo shows it.
            EmailCode::asSecondFactor(),
            RecoveryCodes::class,
        ]);

        // Two factors once someone has set one up, and a passkey or security
        // key whenever they have one.
        Keyring::require(Requirement::aal2()->ifEnrolled()->noDowngrade());

        // Everyone needs a second factor: until they've set one up, every page
        // sends them to the "enrollment_url" in config/keyring.php.
        $this->app->make(Kernel::class)->appendMiddlewareToGroup('web', 'keyring.enrolled');

        // The account changes are this app's code, in app/Actions/Keyring.
        Keyring::createUsersUsing(CreateNewUser::class);
        Keyring::resetUserPasswordsUsing(ResetUserPassword::class);
        Keyring::updateUserPasswordsUsing(UpdateUserPassword::class);
        Keyring::validateEmailChangesUsing(ValidateEmailChange::class);

        // Every email Keyring sends is one of this app's notifications, in
        // app/Notifications/Keyring, built from the Maizzle templates in
        // resources/emails. A security notice left out here isn't sent.
        Keyring::notifications([
            'verification_code' => Notifications\VerificationCode::class,
            'confirm_email_change' => Notifications\ConfirmEmailChange::class,
            'email_change_notice' => Notifications\EmailChangeNotice::class,
            'email_address_in_use' => Notifications\EmailAddressInUse::class,
            'already_registered' => Notifications\AlreadyRegistered::class,
            'password_changed' => Notifications\PasswordChanged::class,
            'authenticator_added' => Notifications\AuthenticatorAdded::class,
            'authenticator_removed' => Notifications\AuthenticatorRemoved::class,
            'recovery_code_used' => Notifications\RecoveryCodeUsed::class,
            'recovery_codes_generated' => Notifications\RecoveryCodesGenerated::class,
            'email_changed' => Notifications\EmailChanged::class,
            'account_locked' => Notifications\AccountLocked::class,
            // An install leaves these five commented out. The demo sends them.
            'new_device' => Notifications\NewDevice::class,
            'second_factor_failed' => Notifications\SecondFactorFailed::class,
            'suspicious_activity' => Notifications\SuspiciousActivity::class,
            'clone_suspected' => Notifications\CloneSuspected::class,
            'email_change_reverted' => Notifications\EmailChangeReverted::class,
        ]);

        // What makes a sign in or a session look wrong, and what to do about
        // it. A sign in after a long quiet period, or after several failed
        // attempts, emails the owner as well as asking for a second factor.
        Keyring::risk()
            ->signals([
                NewDevice::class,
                RepeatedFactorFailures::class,
                SessionFingerprintChanged::class,
                InactiveAccount::class,
                SuccessAfterFailures::class,
            ])
            ->respond(fn (Risk $risk) => match ($risk->level) {
                Level::Low => Action::allow(),
                Level::Medium => $risk->has('inactive_account') || $risk->has('success_after_failures')
                    ? Action::stepUp()->notify()
                    : Action::stepUp(),
                Level::High => Action::stepUp()->notify(),
                Level::Critical => Action::deny()->revokeAllSessions()->notify(),
            });

        // Keyring's pages already match the starter kit's names (auth/login,
        // auth/challenge...). Step-up confirmation reuses the challenge page.
        Keyring::page('confirm', 'auth/challenge');
    }

    /**
     * Any security key, as the demo ships. With SECURITY_KEY_ATTESTATION set,
     * only keys whose maker vouches for them, and with SECURITY_KEY_MODELS
     * only those models (see config/security_keys.php). Passkeys are left
     * alone: the ones that sync have no attestation worth checking.
     */
    protected function securityKeys(): WebAuthn
    {
        $keys = WebAuthn::securityKeys();

        if (! config('security_keys.attestation')) {
            return $keys;
        }

        $models = config('security_keys.models');

        return $models === []
            ? $keys->requireAttestation()
            : $keys->requireAttestation()->allowOnly($models);
    }
}
