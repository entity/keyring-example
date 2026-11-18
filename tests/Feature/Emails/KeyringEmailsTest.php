<?php

namespace Tests\Feature\Emails;

use App\Models\User;
use App\Notifications\Keyring\AlreadyRegistered;
use App\Notifications\Keyring\ConfirmEmailChange;
use App\Notifications\Keyring\EmailChangeNotice;
use App\Notifications\Keyring\VerificationCode;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\File;
use Keyring\Facades\Keyring;
use Keyring\KeyringManager;
use Keyring\Notifications\AccountLocked;
use Keyring\Notifications\AuthenticatorAdded;
use Keyring\Notifications\CloneSuspected;
use Keyring\Notifications\NewDevice;
use Keyring\Notifications\PasswordChanged;
use Keyring\Notifications\RecoveryCodeUsed;
use Keyring\Notifications\SecondFactorFailed;
use Keyring\Notifications\SecurityNotice;
use Keyring\Notifications\SuspiciousActivity;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Mime\Email;
use Tests\TestCase;

class KeyringEmailsTest extends TestCase
{
    use RefreshDatabase;

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
            'loginUrl' => 'https://example.com/login', 'resetUrl' => 'https://example.com/forgot-password',
        ]);

        $mail = $this->render($notification->toMail(new User));

        $this->assertWellFormed($mail);

        if ($notification instanceof SecurityNotice) {
            $data = $notification->toMail(new User)->viewData;

            $this->assertFileExists(public_path("images/emails/{$data['icon']}-{$data['tone']}.png"), "{$type} shows an icon that hasn't been drawn: run `npm run emails:images`.");
        }
    }

    /**
     * What every email has: the HTML with the logo and app name, and a plain
     * text part with no markup and one blank line between paragraphs.
     *
     * @param  array{html: string, text: string}  $mail
     */
    protected function assertWellFormed(array $mail): void
    {
        $this->assertStringContainsString('<!DOCTYPE html>', $mail['html']);
        $this->assertStringContainsString(config('app.name'), $mail['html']);
        $this->assertStringContainsString(config('app.url').'/images/emails/logo.png', $mail['html']);
        $this->assertStringNotContainsString('{{', $mail['html'].$mail['text']);
        $this->assertStringNotContainsString('@if', $mail['html'].$mail['text']);

        $this->assertStringStartsWith(config('app.name')."\n\n", $mail['text']);
        $this->assertDoesNotMatchRegularExpression('/<[a-z][^>]*>/i', $mail['text']);
        $this->assertDoesNotMatchRegularExpression('/\n\s*\n\s*\n/', $mail['text']);
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

        // A box for each digit, in order, with an empty bar between the
        // groups and nothing between the boxes, so copying them gives the
        // code alone.
        $this->assertSame(1, preg_match('#(?:<span[^>]*>[0-9]?</span>){9}#', $mail['html'], $boxes));
        preg_match_all('#<span[^>]*>([0-9]?)</span>#', $boxes[0], $cells);
        $this->assertSame(['1', '2', '3', '4', '', '5', '6', '7', '8'], $cells[1]);
        $this->assertSame('12345678', strip_tags($boxes[0]));

        $this->assertStringContainsString('Your code: 1234 5678', $mail['text']);
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

    public function test_an_address_that_already_has_an_account_is_sent_to_sign_in_or_reset()
    {
        $with = $this->render((new AlreadyRegistered('https://example.com/login', 'https://example.com/forgot-password'))->toMail(new User));
        $without = $this->render((new AlreadyRegistered('https://example.com/login'))->toMail(new User));

        $this->assertStringContainsString('href="https://example.com/login"', $with['html']);
        $this->assertStringContainsString('href="https://example.com/forgot-password"', $with['html']);
        $this->assertStringContainsString('https://example.com/forgot-password', $with['text']);
        $this->assertStringNotContainsString('Reset your password', $without['html'].$without['text']);
    }

    public function test_a_locked_account_is_sent_to_reset_its_password()
    {
        $mail = $this->render((new AccountLocked(when: 'now', url: 'https://example.com/forgot-password'))->toMail(new User));

        $this->assertStringContainsString('href="https://example.com/forgot-password"', $mail['html']);
        $this->assertStringContainsString('Reset your password', $mail['text']);
    }

    public function test_the_emails_that_say_who_to_contact_link_to_the_support_contact()
    {
        $address = $this->render((new AuthenticatorAdded(when: 'now', contact: 'help@example.com'))->toMail(new User));
        $page = $this->render((new VerificationCode('12345678', 10, contact: 'https://example.com/support'))->toMail(new User));
        $phone = $this->render((new EmailChangeNotice('n•••@example.com', 'https://example.com/revert', contact: '<b>0800 000 000</b>'))->toMail(new User));
        $none = $this->render((new AuthenticatorAdded(when: 'now'))->toMail(new User));

        $this->assertStringContainsString('href="mailto:help@example.com"', $address['html']);
        $this->assertStringContainsString('contact us: help@example.com', preg_replace('/\s+/', ' ', $address['text']));
        $this->assertStringContainsString('href="https://example.com/support"', $page['html']);
        $this->assertStringContainsString('&lt;b&gt;0800 000 000&lt;/b&gt;', $phone['html']);
        $this->assertStringNotContainsString('href="<b>', $phone['html']);
        $this->assertStringNotContainsString('contact us', $none['html'].$none['text']);
    }

    public function test_keyring_hands_the_support_contact_to_the_emails_it_sends()
    {
        config(['keyring.support_contact' => 'help@example.com']);

        $notification = Keyring::requiredNotification('password_changed', ['when' => 'now']);

        $this->assertStringContainsString('href="mailto:help@example.com"', $this->render($notification->toMail(new User))['html']);
    }

    public function test_alerts_and_confirmations_each_have_their_own_tone()
    {
        $tone = fn (SecurityNotice $notice) => $notice->toMail(new User)->viewData['tone'];

        $this->assertSame('critical', $tone(new SecondFactorFailed(when: 'now')));
        $this->assertSame('critical', $tone(new AccountLocked(when: 'now')));
        $this->assertSame('warning', $tone(new NewDevice(when: 'now')));
        $this->assertSame('success', $tone(new PasswordChanged(when: 'now')));

        $html = $this->render((new SecondFactorFailed(when: 'now'))->toMail(new User))['html'];

        $this->assertStringContainsString(config('app.url').'/images/emails/shield-alert-critical.png', $html);
    }

    public function test_unusual_activity_lists_what_was_noticed()
    {
        $mail = $this->render((new SuspiciousActivity(when: 'now', reasons: 'Signing in from a new country (NL). 5 failed second factors in the last 1h.'))->toMail(new User));

        // The same email goes out whether the sign in was let through,
        // asked for more or refused, so it doesn't say which.
        $this->assertStringContainsString('We noticed something unusual about a sign in to your account.', $mail['text']);
        $this->assertStringNotContainsString('extra verification', $mail['text']);
        $this->assertStringContainsString('What we noticed', $mail['html']);
        $this->assertStringContainsString("- Signing in from a new country (NL).\n- 5 failed second factors in the last 1h.", $mail['text']);
    }

    public function test_a_used_recovery_code_says_how_many_are_left_and_when_to_make_more()
    {
        $plenty = $this->render((new RecoveryCodeUsed(when: 'now', remaining: 7))->toMail(new User));
        $few = $this->render((new RecoveryCodeUsed(when: 'now', remaining: 1))->toMail(new User));

        $this->assertStringContainsString('Codes left: 7', $plenty['text']);
        $this->assertStringNotContainsString('running low', $plenty['text']);
        $this->assertStringContainsString('running low', $few['text']);
    }

    public function test_a_security_key_alert_names_the_key()
    {
        $mail = $this->render((new CloneSuspected(when: 'now', name: 'YubiKey <5C>'))->toMail(new User));

        $this->assertStringContainsString('YubiKey &lt;5C&gt;', $mail['html']);
        $this->assertStringContainsString('Security key: YubiKey <5C>', $mail['text']);
    }

    public function test_the_details_show_when_and_where_without_empty_rows()
    {
        $mail = $this->render((new PasswordChanged(when: 'Monday', ip: '203.0.113.7'))->toMail(new User));

        $this->assertStringContainsString("When: Monday\nIP address: 203.0.113.7", $mail['text']);
        $this->assertStringNotContainsString('Device:', $mail['text']);
    }

    public function test_a_link_email_has_a_button_and_the_link_in_full()
    {
        $mail = $this->render((new ConfirmEmailChange('https://example.com/confirm?signature=abc', now()->addDay()))->toMail(new User));

        $this->assertSame(2, substr_count($mail['html'], 'href="https://example.com/confirm?signature=abc"'));
        $this->assertStringContainsString("Confirm email address:\nhttps://example.com/confirm?signature=abc", $mail['text']);
    }

    public function test_the_verification_email_uses_the_apps_template()
    {
        $user = (new User)->forceFill(['id' => 5, 'email' => 'nora@example.com']);

        $mail = (new VerifyEmail)->toMail($user);
        $rendered = $this->render($mail);

        $this->assertSame('Verify your email address', $mail->subject);
        $this->assertWellFormed($rendered);
        $this->assertMatchesRegularExpression('#href="'.preg_quote(url('/email/verify/'.$user->id), '#').'/[0-9a-f]+\?expires=\d+&amp;signature=[0-9a-f]+"#', $rendered['html']);
        $this->assertStringContainsString('This link expires in 60 minutes.', $rendered['text']);
    }

    public function test_the_password_reset_email_uses_the_apps_template()
    {
        $user = (new User)->forceFill(['id' => 5, 'email' => 'nora@example.com']);

        $mail = (new ResetPassword('a-token'))->toMail($user);
        $rendered = $this->render($mail);

        $this->assertSame('Reset your password', $mail->subject);
        $this->assertWellFormed($rendered);
        $this->assertStringContainsString('href="'.e(route('password.reset', ['token' => 'a-token', 'email' => 'nora@example.com'])).'"', $rendered['html']);
        $this->assertStringContainsString(route('password.reset', ['token' => 'a-token', 'email' => 'nora@example.com']), $rendered['text']);
    }

    public function test_the_inbox_preview_line_says_what_happened()
    {
        $notice = $this->render((new PasswordChanged(when: 'now'))->toMail(new User))['html'];
        $code = $this->render((new VerificationCode('12345678', 10))->toMail(new User))['html'];

        $this->assertStringContainsString('mso-hide:all;">The password for your account was just changed.', $notice);
        $this->assertStringContainsString('It expires in 10', $code);
        $this->assertMatchesRegularExpression('/This link expires \S.* from now\./', $this->render((new ConfirmEmailChange('https://example.com/confirm', now()->addDay()))->toMail(new User))['text']);
    }

    /**
     * The request that sends a reset email says what host it's for, and
     * whoever sends it chooses that. The logo, icons and links come from
     * APP_URL all the same.
     */
    public function test_a_forged_host_doesnt_reach_the_emails()
    {
        $user = User::factory()->create();

        $this->post('http://evil.example/forgot-password', ['email' => $user->email]);

        $sent = app('mailer')->getSymfonyTransport()->messages();
        $this->assertCount(1, $sent);
        $email = $sent[0]->getOriginalMessage();
        $this->assertInstanceOf(Email::class, $email);
        $body = $email->getHtmlBody().$email->getTextBody();

        $this->assertStringContainsString(config('app.url').'/images/emails/logo.png', $body);
        $this->assertStringNotContainsString('evil.example', $body);
    }

    public function test_a_security_notice_rendered_under_a_forged_host_keeps_to_app_url()
    {
        $this->get('http://evil.example/login');

        $mail = $this->render((new NewDevice(when: 'now'))->toMail(new User));

        $this->assertStringContainsString(config('app.url').'/images/emails/monitor-smartphone-warning.png', $mail['html']);
        $this->assertStringNotContainsString('evil.example', $mail['html'].$mail['text']);
    }

    public function test_the_email_gallery_is_only_there_while_developing()
    {
        $this->get('/emails')->assertNotFound();
        $this->get('/emails/new_device')->assertNotFound();
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
