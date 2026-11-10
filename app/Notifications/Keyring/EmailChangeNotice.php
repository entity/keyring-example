<?php

namespace App\Notifications\Keyring;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to the current address during an email change: your email is being
 * changed, with a link to cancel it. Unless whoever asked proved a second
 * factor the account has had for a while, the change must be confirmed from
 * here too, with $confirmUrl. The notifiable is that bare address, not your
 * user.
 */
class EmailChangeNotice extends Notification
{
    /**
     * @param  string  $email  the new address, with most of its name hidden
     */
    public function __construct(
        public string $email,
        #[\SensitiveParameter] public string $revertUrl,
        #[\SensitiveParameter] public ?string $confirmUrl = null,
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
        return (new MailMessage)->subject(__('Your email address is being changed'))->view(['html' => 'emails.keyring.email-change-notice', 'text' => 'emails.keyring.text.email-change-notice'], [
            'email' => $this->email,
            'revertUrl' => $this->revertUrl,
            'confirmUrl' => $this->confirmUrl,
        ]);
    }
}
