<?php

declare(strict_types=1);

namespace App\Notifications\Keyring;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Contracts\Auth\CanResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Laravel's own email verification and password reset emails, which Keyring
 * sends during registration and password resets, built from this app's
 * Maizzle templates so they match the rest. KeyringServiceProvider hands
 * these to VerifyEmail::toMailUsing() and ResetPassword::toMailUsing().
 *
 * Each keeps its link as the message's action too, as Laravel's own email
 * does, for code that reads it from there (the registration tests do).
 */
final class LaravelMail
{
    /**
     * Laravel has already built the signed link, from APP_URL as Keyring
     * asks it to.
     */
    public static function verifyEmail(object $notifiable, string $url): MailMessage
    {
        return (new MailMessage)->subject(__('Verify your email address'))->action(__('Verify email address'), $url)->view(['html' => 'emails.keyring.verify-email', 'text' => 'emails.keyring.text.verify-email'], [
            'url' => $url,
            'minutes' => (int) config('auth.verification.expire', 60),
        ]);
    }

    /**
     * Laravel only hands over the token, so the link is built the way its
     * own email does: with Keyring's callback, or the password.reset route.
     */
    public static function resetPassword(CanResetPassword $notifiable, #[\SensitiveParameter] string $token): MailMessage
    {
        $url = ResetPassword::$createUrlCallback !== null
            ? (ResetPassword::$createUrlCallback)($notifiable, $token)
            : url(route('password.reset', ['token' => $token, 'email' => $notifiable->getEmailForPasswordReset()], false));

        return (new MailMessage)->subject(__('Reset your password'))->action(__('Reset password'), $url)->view(['html' => 'emails.keyring.reset-password', 'text' => 'emails.keyring.text.reset-password'], [
            'url' => $url,
            'minutes' => (int) config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 60),
        ]);
    }
}
