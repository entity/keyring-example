<?php

namespace App\Notifications\Keyring;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to an address that already has an account when someone tries to move
 * another account to it, instead of telling them it's taken. The notifiable
 * is that bare address, not your user.
 */
class EmailAddressInUse extends Notification
{
    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)->subject(__('Someone tried to use your email address'))->view(['html' => 'emails.keyring.email-address-in-use', 'text' => 'emails.keyring.text.email-address-in-use']);
    }
}
