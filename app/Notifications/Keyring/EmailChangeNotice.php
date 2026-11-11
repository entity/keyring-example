<?php

declare(strict_types=1);

namespace App\Notifications\Keyring;

use App\Support\SupportContact;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to the current address during an email change: your email is being
 * changed, with a link to cancel it. Unless the session that asked proved a
 * second factor the account has had a while, this address must confirm too,
 * and gets $confirmUrl. The notifiable is that bare address, not your user.
 */
class EmailChangeNotice extends Notification
{
    /**
     * @param  string  $email  the new address, with most of its name hidden
     * @param  string|null  $contact  "support_contact" from config/keyring.php: a URL or an address
     */
    public function __construct(
        public string $email,
        #[\SensitiveParameter] public string $revertUrl,
        #[\SensitiveParameter] public ?string $confirmUrl = null,
        public ?string $contact = null,
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
            ...SupportContact::for($this->contact),
        ]);
    }
}
