<?php

namespace App\Notifications\Keyring;

use DateTimeInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueueAfterCommit;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * What every security notice shares: who it goes to, and the Maizzle
 * template it's built from. Each notice only says its subject and intro.
 *
 * Queued once any open transaction commits, so a change that's rolled back
 * is never announced.
 */
abstract class SecurityNotice extends Notification implements ShouldQueueAfterCommit
{
    use Queueable;

    /**
     * Keyring fills in whichever of these the notice has. Some hold what
     * users and browsers sent (a key's name, a user agent), cut to one line,
     * so escape them for wherever you show them. $when is $at as text in
     * the app's timezone: format $at yourself for the user's own.
     */
    public function __construct(
        public string $when,
        public ?DateTimeInterface $at = null,
        public ?string $device = null,
        public ?string $ip = null,
        public ?string $name = null,
        public ?int $remaining = null,
        public ?string $reasons = null,
        public ?string $url = null,
    ) {}

    abstract protected function subject(): string;

    abstract protected function intro(): string;

    /**
     * The label of the button to $url, for notices that have one.
     */
    protected function action(): ?string
    {
        return null;
    }

    /**
     * The notifiable is a bare address, not your user, for the copies of an
     * email change sent to the address the account no longer has.
     *
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Every notice uses one Maizzle template, resources/emails/keyring/notice.vue,
     * which `npm run emails` builds into these two views. Blade escapes what
     * the HTML one prints, so a name someone typed can't add markup to it.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $details = array_filter([__('When') => $this->when, __('Device') => $this->device, __('IP address') => $this->ip]);

        return (new MailMessage)->subject($this->subject())->view(['html' => 'emails.keyring.notice', 'text' => 'emails.keyring.text.notice'], [
            'subject' => $this->subject(),
            'intro' => $this->intro(),
            'details' => array_map(fn (string $label, string $value) => ['label' => $label, 'value' => $value], array_keys($details), $details),
            'actionText' => $this->action(),
            'actionUrl' => $this->action() === null ? null : $this->url,
        ]);
    }
}
