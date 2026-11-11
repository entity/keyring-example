<?php

declare(strict_types=1);

namespace App\Notifications\Keyring;

use DateTimeInterface;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Carbon;

/**
 * Sent to the new address during an email change: confirm it's yours. The
 * notifiable is that bare address, not your user.
 */
class ConfirmEmailChange extends Notification
{
    public function __construct(
        #[\SensitiveParameter] public string $url,
        public DateTimeInterface $expiresAt,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)->subject(__('Confirm your new email address'))->view(['html' => 'emails.keyring.confirm-email-change', 'text' => 'emails.keyring.text.confirm-email-change'], [
            'url' => $this->url,
            'expires' => Carbon::instance($this->expiresAt)->diffForHumans(),
        ]);
    }
}
