<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Collection;
use Keyring\Facades\Keyring;
use Keyring\KeyringManager;

/**
 * The local-only email gallery at /emails (routes/web.php): every email the
 * app sends, with sample content, grouped the way the gallery shows them.
 */
class EmailGallery
{
    /** The gallery's groups, in the order it shows them. */
    public const array GROUPS = ['Security alerts', 'Confirmations', 'Emails a flow needs', "Laravel's emails"];

    /**
     * Every email Keyring sends, and Laravel's two it sends for registration
     * and resets.
     *
     * @return list<string>
     */
    public function types(): array
    {
        return [...KeyringManager::NOTIFICATIONS, 'verify_email', 'reset_password'];
    }

    /**
     * One email, as sent to a made-up user.
     */
    public function sample(string $type): MailMessage
    {
        $user = (new User)->forceFill(['id' => 1, 'name' => 'Nora', 'email' => 'nora@example.com']);

        $notification = match ($type) {
            'verify_email' => new VerifyEmail,
            'reset_password' => new ResetPassword('a-sample-token'),
            default => Keyring::requiredNotification($type, [
                'when' => now()->toDayDateTimeString(),
                'at' => now(),
                'device' => 'Firefox on Windows',
                'ip' => '203.0.113.7',
                'name' => 'YubiKey 5C',
                'remaining' => 2,
                'reasons' => 'Signing in from a new country (NL). The first sign in for 94 days.',
                'url' => url('/'),
                'expiresAt' => now()->addDay(),
                'code' => '12345678',
                'minutes' => 10,
                'enrolling' => false,
                'email' => 'n•••@example.com',
                'revertUrl' => url('/'),
                'confirmUrl' => url('/'),
                'loginUrl' => route('login'),
                'resetUrl' => route('password.request'),
            ]),
        };

        abort_unless(method_exists($notification, 'toMail'), 404);

        return $notification->toMail($user);
    }

    /**
     * Every sample, grouped. Only Keyring's security notices are given a
     * tone (by NoticeMail), which tells alerts from confirmations.
     *
     * @return Collection<string, Collection<int, array{type: string, mail: MailMessage}>>
     */
    public function groups(): Collection
    {
        return collect($this->types())
            ->map(fn (string $type) => ['type' => $type, 'mail' => $this->sample($type)])
            ->groupBy(fn (array $email) => $this->group($email['type'], $email['mail']))
            ->sortKeysUsing(fn (string $a, string $b) => array_search($a, self::GROUPS) <=> array_search($b, self::GROUPS));
    }

    /**
     * An email's plain text part, or null when it hasn't one.
     */
    public function text(string $type): ?string
    {
        $mail = $this->sample($type);
        $view = is_array($mail->view) ? $mail->view['text'] ?? null : null;

        return is_string($view) && view()->exists($view) ? view($view, $mail->viewData)->render() : null;
    }

    protected function group(string $type, MailMessage $mail): string
    {
        return match (true) {
            in_array($type, ['verify_email', 'reset_password']) => "Laravel's emails",
            ! isset($mail->viewData['tone']) => 'Emails a flow needs',
            in_array($mail->viewData['tone'], ['critical', 'warning']) => 'Security alerts',
            default => 'Confirmations',
        };
    }
}
