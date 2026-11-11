<?php

declare(strict_types=1);

namespace App\Notifications\Keyring;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to an address that already has an account when someone tries to
 * register with it, instead of telling them it's taken. The notifiable is
 * that bare address, not your user.
 */
class AlreadyRegistered extends Notification
{
    /**
     * @param  string|null  $resetUrl  null when the app has no password resets
     */
    public function __construct(
        public string $loginUrl,
        public ?string $resetUrl = null,
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
        return (new MailMessage)->subject(__('You already have an account'))->view(['html' => 'emails.keyring.already-registered', 'text' => 'emails.keyring.text.already-registered'], [
            'loginUrl' => $this->loginUrl,
            'resetUrl' => $this->resetUrl,
        ]);
    }
}
