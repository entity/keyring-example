<?php

namespace Tests\Feature\Emails;

use App\Models\User;
use App\Notifications\Keyring\AuthenticatorAdded;
use App\Notifications\Keyring\EmailChangeNotice;
use App\Notifications\Keyring\NewDevice;
use App\Notifications\Keyring\VerificationCode;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\File;
use Keyring\Facades\Keyring;
use Keyring\KeyringManager;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class KeyringEmailsTest extends TestCase
{
    /**
     * @return array{html: string, text: string}
     */
    protected function render(MailMessage $mail): array
    {
        return [
            'html' => view($mail->view['html'], $mail->viewData)->render(),
            'text' => view($mail->view['text'], $mail->viewData)->render(),
        ];
    }

    #[DataProvider('types')]
    public function test_every_email_keyring_sends_is_registered_and_renders(string $type)
    {
        $notification = Keyring::requiredNotification($type, [
            'when' => 'Monday', 'at' => now(), 'device' => 'Firefox on Windows', 'ip' => '203.0.113.7',
            'name' => 'YubiKey', 'remaining' => 7, 'reasons' => 'A new country.',
            'url' => 'https://example.com/link', 'expiresAt' => now()->addDay(),
            'code' => '12345678', 'minutes' => 10, 'enrolling' => false,
            'email' => 'n•••@example.com', 'revertUrl' => 'https://example.com/revert', 'confirmUrl' => null,
        ]);

        $mail = $this->render($notification->toMail(new User));

        $this->assertStringContainsString('<!DOCTYPE html>', $mail['html']);
        $this->assertStringContainsString(config('app.name'), $mail['html']);
        $this->assertNotEmpty($mail['text']);
        $this->assertStringNotContainsString('{{', $mail['html'].$mail['text']);
    }

    /**
     * @return array<string, array{string}>
     */
    public static function types(): array
    {
        return array_combine(KeyringManager::NOTIFICATIONS, array_map(fn (string $type) => [$type], KeyringManager::NOTIFICATIONS));
    }

    public function test_a_name_someone_typed_cant_add_markup_to_an_email()
    {
        $mail = $this->render((new AuthenticatorAdded(when: 'now', name: '<a href="https://evil.example">Robert\'s key</a>'))->toMail(new User));

        $this->assertStringNotContainsString('<a href="https://evil.example">', $mail['html']);
        $this->assertStringContainsString('&lt;a href=&quot;https://evil.example&quot;&gt;Robert&#039;s key&lt;/a&gt;', $mail['html']);
        $this->assertStringContainsString('"<a href="https://evil.example">Robert\'s key</a>" was added', $mail['text']);
    }

    public function test_the_code_is_shown_in_two_groups_and_says_how_long_it_lasts()
    {
        $mail = $this->render((new VerificationCode('12345678', 10))->toMail(new User));

        $this->assertStringContainsString('1234 5678', $mail['html']);
        $this->assertStringContainsString('It expires in 10 minutes.', $mail['text']);
    }

    public function test_a_new_device_email_links_to_the_report_page()
    {
        $mail = $this->render((new NewDevice(when: 'now', url: 'https://example.com/devices/1/report?signature=abc'))->toMail(new User));

        $this->assertStringContainsString('href="https://example.com/devices/1/report?signature=abc"', $mail['html']);
        $this->assertStringContainsString("This wasn't me", $mail['text']);
    }

    public function test_the_change_notice_only_asks_this_address_to_confirm_when_it_has_to()
    {
        $without = $this->render((new EmailChangeNotice('n•••@example.com', 'https://example.com/revert'))->toMail(new User));
        $with = $this->render((new EmailChangeNotice('n•••@example.com', 'https://example.com/revert', 'https://example.com/confirm'))->toMail(new User));

        $this->assertStringNotContainsString('Confirm the change', $without['html']);
        $this->assertStringContainsString('href="https://example.com/confirm"', $with['html']);
        $this->assertStringContainsString('href="https://example.com/revert"', $without['html']);
    }

    public function test_the_built_views_are_up_to_date_with_their_templates()
    {
        foreach (File::files(resource_path('emails/keyring')) as $template) {
            $name = $template->getFilenameWithoutExtension();

            $this->assertFileExists(resource_path("views/emails/keyring/{$name}.blade.php"), "Run `npm run emails` to build {$name}.");
            $this->assertFileExists(resource_path("views/emails/keyring/text/{$name}.blade.php"));
        }
    }
}
