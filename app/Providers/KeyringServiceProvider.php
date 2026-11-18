<?php

declare(strict_types=1);

namespace App\Providers;

use App\Actions\Keyring\CreateNewUser;
use App\Actions\Keyring\ResetUserPassword;
use App\Actions\Keyring\UpdateUserPassword;
use App\Actions\Keyring\ValidateEmailChange;
use App\Notifications\Keyring as Notifications;
use App\Support\SupportContact;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\ServiceProvider;
use Keyring\Facades\Keyring;
use Keyring\Factors\EmailCode;
use Keyring\Factors\Password;
use Keyring\Factors\RecoveryCodes;
use Keyring\Factors\Totp;
use Keyring\Factors\WebAuthn;
use Keyring\Login\Requirement;
use Keyring\Notifications\CloneSuspected;
use Keyring\Notifications\SecurityNotice;
use Keyring\Risk\Signals\BreachedPassword;
use Keyring\Risk\Signals\ImpossibleTravel;
use Keyring\Risk\Signals\InactiveAccount;
use Keyring\Risk\Signals\NewCountry;
use Keyring\Risk\Signals\NewDevice;
use Keyring\Risk\Signals\RecentlyChangedRecovery;
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
            EmailCode::asExtraStep(),
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

        // Keyring sends its own security notices. This app only gives them
        // its look: every one is built from one Maizzle template,
        // resources/emails/keyring/notice.vue.
        SecurityNotice::toMailUsing(self::noticeMail(...));

        // The five emails a flow needs each have a shape of their own, so
        // they're this app's classes, in app/Notifications/Keyring, with a
        // template each. The suspected clone is the one notice Keyring
        // leaves off until it's asked for. The demo sends it.
        Keyring::notifications([
            'verification_code' => Notifications\VerificationCode::class,
            'confirm_email_change' => Notifications\ConfirmEmailChange::class,
            'email_change_notice' => Notifications\EmailChangeNotice::class,
            'email_address_in_use' => Notifications\EmailAddressInUse::class,
            'already_registered' => Notifications\AlreadyRegistered::class,
            'clone_suspected' => CloneSuspected::class,
        ]);

        // What makes a sign in or a session look wrong. Keyring's own
        // response does the rest: a second factor at medium, an email to the
        // owner from high, and a refused sign in at critical. A sign in
        // after a long quiet period, or after several failed attempts,
        // emails the owner whatever it scores.
        Keyring::risk()->signals([
            NewDevice::class,
            RepeatedFactorFailures::class,
            SessionFingerprintChanged::class,
            InactiveAccount::class,
            SuccessAfterFailures::class,
            // Email changes are on, and an address that changed this week
            // shouldn't be trusted on its own.
            RecentlyChangedRecovery::class,
            // These two stay quiet until there's a locator (KEYRING_LOCATOR,
            // see config/keyring.php), so they're always on. A new country
            // and impossible travel together add up to 90, which refuses
            // the sign in: on the demo locator, sign in from London and then
            // from Tokyo to see it.
            NewCountry::class,
            ImpossibleTravel::class,
            // Every password sign in asks Have I Been Pwned, so it's only on
            // with BREACHED_PASSWORD_CHECK. A password it finds holds the
            // user on the security page until they choose another.
            ...config('keyring.passwords.uncompromised') ? [BreachedPassword::class] : [],
        ]);

        // Keyring's pages already match the starter kit's names (auth/login,
        // auth/challenge...). Step-up confirmation reuses the challenge page.
        Keyring::page('confirm', 'auth/challenge');
    }

    /**
     * The email of every security notice, from the one Maizzle template
     * `npm run emails` builds into these two views. Blade escapes what the
     * HTML one prints, so a name someone typed can't add markup to it.
     */
    protected static function noticeMail(SecurityNotice $notice, object $notifiable): MailMessage
    {
        $details = array_filter([__('When') => $notice->when, __('Device') => $notice->device, __('IP address') => $notice->ip]);

        return (new MailMessage)->subject($notice->subject())->view(['html' => 'emails.keyring.notice', 'text' => 'emails.keyring.text.notice'], [
            'subject' => $notice->subject(),
            'intro' => $notice->intro(),
            'details' => array_map(fn (string $label, string $value) => ['label' => $label, 'value' => $value], array_keys($details), $details),
            'actionText' => $notice->action(),
            'actionUrl' => $notice->action() === null ? null : $notice->url,
            ...SupportContact::for($notice->contact),
        ]);
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
