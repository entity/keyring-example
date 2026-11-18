<?php

declare(strict_types=1);

namespace App\Notifications\Keyring;

use App\Support\SupportContact;
use Illuminate\Notifications\Messages\MailMessage;
use Keyring\Notifications\AccountLocked;
use Keyring\Notifications\AuthenticatorAdded;
use Keyring\Notifications\AuthenticatorRemoved;
use Keyring\Notifications\CloneSuspected;
use Keyring\Notifications\EmailChanged;
use Keyring\Notifications\EmailChangeReverted;
use Keyring\Notifications\NewDevice;
use Keyring\Notifications\PasswordChanged;
use Keyring\Notifications\RecoveryCodesGenerated;
use Keyring\Notifications\RecoveryCodeUsed;
use Keyring\Notifications\SecondFactorFailed;
use Keyring\Notifications\SecurityNotice;
use Keyring\Notifications\SuspiciousActivity;

/**
 * The email of every security notice Keyring sends, from the one Maizzle
 * template `npm run emails` builds into emails.keyring.notice. Keyring says
 * what happened; this gives each notice its look: a tone (alerts in red or
 * amber, confirmations in green), an icon, a short label, the details that
 * matter for it, and what to do if it wasn't you.
 *
 * Blade escapes what the HTML view prints, so a key's name or a user agent
 * can't add markup to it.
 */
final class NoticeMail
{
    /**
     * Fewer recovery codes left than this, and the email says to make more.
     */
    public const int LOW_ON_CODES = 3;

    public static function build(SecurityNotice $notice, object $notifiable): MailMessage
    {
        $look = self::look($notice);

        $details = array_filter([
            ['label' => $look['nameLabel'] ?? null, 'value' => $notice->name],
            ['label' => __('Codes left'), 'value' => $notice instanceof RecoveryCodeUsed ? $notice->remaining : null],
            ['label' => __('When'), 'value' => $notice->when],
            ['label' => __('Device'), 'value' => $notice->device],
            ['label' => __('IP address'), 'value' => $notice->ip],
        ], fn (array $row) => $row['label'] !== null && $row['value'] !== null && $row['value'] !== '');

        $intro = $look['intro'] ?? $notice->intro();

        return (new MailMessage)->subject($notice->subject())->view(['html' => 'emails.keyring.notice', 'text' => 'emails.keyring.text.notice'], [
            'subject' => $notice->subject(),
            'preheader' => $intro,
            'tone' => $look['tone'],
            'icon' => $look['icon'],
            'eyebrow' => $look['eyebrow'],
            'intro' => $intro,
            'reasons' => $notice instanceof SuspiciousActivity ? self::reasons($notice->reasons) : [],
            'details' => array_values(array_map(fn (array $row) => ['label' => $row['label'], 'value' => (string) $row['value']], $details)),
            'actionText' => $notice->action(),
            'actionUrl' => $notice->action() === null ? null : $notice->url,
            'adviceTitle' => $look['adviceTitle'] ?? __('Wasn\'t you?'),
            'advice' => $look['advice'],
            ...SupportContact::for($notice->contact),
        ]);
    }

    /**
     * How each notice looks. The tone picks the colours, and the icon is an
     * image in public/images/emails drawn in that tone (see
     * resources/emails/images.mjs). A notice of the app's own falls back to
     * a plain one.
     *
     * @return array{tone: string, icon: string, eyebrow: string, advice: string, adviceTitle?: string, intro?: string, nameLabel?: string}
     */
    protected static function look(SecurityNotice $notice): array
    {
        return match (true) {
            $notice instanceof NewDevice => [
                'tone' => 'warning',
                'icon' => 'monitor-smartphone',
                'eyebrow' => __('New sign-in'),
                'adviceTitle' => __('Was this you?'),
                'advice' => __('Then there\'s nothing to do. If it wasn\'t, use the button above to sign that device out, then change your password.'),
            ],
            $notice instanceof SecondFactorFailed => [
                'tone' => 'critical',
                'icon' => 'shield-alert',
                'eyebrow' => __('Security alert'),
                'adviceTitle' => __('What to do'),
                'advice' => __('If it wasn\'t you, change your password now. Your second step kept them out, but they know your password.'),
            ],
            $notice instanceof AccountLocked => [
                'tone' => 'critical',
                'icon' => 'lock-keyhole',
                'eyebrow' => __('Account locked'),
                'adviceTitle' => __('What to do'),
                'advice' => __('If you were trying to sign in, reset your password to get back in. If it wasn\'t you, someone may be guessing your password, and a new one keeps them out too.'),
            ],
            $notice instanceof CloneSuspected => [
                'tone' => 'critical',
                'icon' => 'copy',
                'eyebrow' => __('Security key alert'),
                'nameLabel' => __('Security key'),
                'adviceTitle' => __('What to do'),
                'advice' => __('Remove the key from your sign-in methods and add it again, or use another one. If you\'ve lost track of it, change your password too.'),
            ],
            $notice instanceof SuspiciousActivity => [
                'tone' => 'warning',
                'icon' => 'shield-alert',
                'eyebrow' => __('Unusual activity'),
                // Whatever was done about it (asking for more, refusing the
                // sign in, or nothing) is up to the risk level, so the
                // intro doesn't say.
                'intro' => __('We noticed something unusual about a sign in to your account.'),
                'adviceTitle' => __('Was this you?'),
                'advice' => __('Then there\'s nothing to do. If it wasn\'t, change your password and check your sign-in methods straight away.'),
            ],
            $notice instanceof RecoveryCodeUsed => [
                'tone' => 'warning',
                'icon' => 'life-buoy',
                'eyebrow' => __('Recovery code used'),
                'advice' => ($notice->remaining ?? 0) < self::LOW_ON_CODES
                    ? __('If you didn\'t use it, change your password straight away. Either way, you\'re running low: make a new set of codes from your security settings.')
                    : __('If you didn\'t use it, change your password and make a new set of recovery codes straight away.'),
            ],
            $notice instanceof EmailChangeReverted => [
                'tone' => 'warning',
                'icon' => 'undo-2',
                'eyebrow' => __('Email change undone'),
                'advice' => __('If you didn\'t undo it, sign in, change your password and check your sign-in methods.'),
            ],
            $notice instanceof PasswordChanged => [
                'tone' => 'success',
                'icon' => 'rectangle-ellipsis',
                'eyebrow' => __('Password changed'),
                'advice' => __('If you didn\'t change it, reset your password straight away and check your sign-in methods.'),
            ],
            $notice instanceof AuthenticatorAdded => [
                'tone' => 'success',
                'icon' => 'key-round',
                'eyebrow' => __('Sign-in method added'),
                'nameLabel' => __('Sign-in method'),
                'advice' => __('If you didn\'t add it, remove it from your sign-in methods and change your password straight away.'),
            ],
            $notice instanceof RecoveryCodesGenerated => [
                'tone' => 'success',
                'icon' => 'life-buoy',
                'eyebrow' => __('New recovery codes'),
                'advice' => __('If you didn\'t make them, someone may be signed in to your account. Change your password and check your sign-in methods straight away.'),
            ],
            $notice instanceof EmailChanged => [
                'tone' => 'success',
                'icon' => 'mail-check',
                'eyebrow' => __('Email address changed'),
                'advice' => __('If you didn\'t change it, use the link in the email we sent to your old address to undo it.'),
            ],
            $notice instanceof AuthenticatorRemoved => [
                'tone' => 'info',
                'icon' => 'key-round',
                'eyebrow' => __('Sign-in method removed'),
                'nameLabel' => __('Sign-in method'),
                'advice' => __('If you didn\'t remove it, someone may be signed in to your account. Change your password and check your sign-in methods straight away.'),
            ],
            default => [
                'tone' => 'info',
                'icon' => 'shield-check',
                'eyebrow' => __('Security notice'),
                'advice' => __('If this wasn\'t you, change your password and check your sign-in methods straight away.'),
            ],
        };
    }

    /**
     * Keyring joins the risk signals' findings, a sentence each, into one
     * line. They read better as a list.
     *
     * @return list<string>
     */
    protected static function reasons(?string $reasons): array
    {
        return array_values(array_filter(preg_split('/(?<=[.!?])\s+(?=[A-Z0-9])/', trim((string) $reasons)) ?: []));
    }
}
