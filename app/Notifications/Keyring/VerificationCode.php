<?php

declare(strict_types=1);

namespace App\Notifications\Keyring;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * The code for signing in with an email code, or for adding one as a sign-in
 * method ($enrolling). Not queued, so it arrives while the user waits.
 */
class VerificationCode extends Notification
{
    use ShowsSupportContact;

    public function __construct(
        #[\SensitiveParameter] public string $code,
        public int $minutes,
        public bool $enrolling = false,
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
        return (new MailMessage)->subject(__('Your verification code'))->view(['html' => 'emails.keyring.verification-code', 'text' => 'emails.keyring.text.verification-code'], [
            'code' => trim(chunk_split($this->code, 4, ' ')),
            'minutes' => $this->minutes,
            'enrolling' => $this->enrolling,
            ...$this->supportContact(),
        ]);
    }
}
