<?php

namespace App\Providers;

use App\Actions\Keyring\CreateNewUser;
use App\Actions\Keyring\ResetUserPassword;
use App\Actions\Keyring\UpdateUserPassword;
use App\Actions\Keyring\ValidateEmailChange;
use App\Notifications\Keyring as Notifications;
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
            $this->securityKeys(),
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

        // Every email Keyring sends is one of this app's notifications, in
        // app/Notifications/Keyring, built from the Maizzle templates in
        // resources/emails. A security notice left out here isn't sent.
        Keyring::notifications([
            'verification_code' => Notifications\VerificationCode::class,
            'confirm_email_change' => Notifications\ConfirmEmailChange::class,
            'email_change_notice' => Notifications\EmailChangeNotice::class,
            'email_address_in_use' => Notifications\EmailAddressInUse::class,
            'new_device' => Notifications\NewDevice::class,
            'password_changed' => Notifications\PasswordChanged::class,
            'authenticator_added' => Notifications\AuthenticatorAdded::class,
            'authenticator_removed' => Notifications\AuthenticatorRemoved::class,
            'second_factor_failed' => Notifications\SecondFactorFailed::class,
            'recovery_code_used' => Notifications\RecoveryCodeUsed::class,
            'suspicious_activity' => Notifications\SuspiciousActivity::class,
            'clone_suspected' => Notifications\CloneSuspected::class,
            'email_changed' => Notifications\EmailChanged::class,
            'email_change_reverted' => Notifications\EmailChangeReverted::class,
        ]);

        Keyring::risk()
            ->signals([NewDevice::class, RepeatedFactorFailures::class, SessionFingerprintChanged::class])
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
