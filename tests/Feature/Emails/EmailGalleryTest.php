<?php

namespace Tests\Feature\Emails;

use App\Support\EmailGallery;
use Illuminate\Support\Facades\Route;
use Keyring\KeyringManager;
use Tests\TestCase;

class EmailGalleryTest extends TestCase
{
    public function test_every_email_is_in_the_gallery_once_in_its_group()
    {
        $groups = (new EmailGallery)->groups()->map(fn ($emails) => $emails->pluck('type')->all());

        $this->assertSame(EmailGallery::GROUPS, $groups->keys()->all());
        $this->assertEqualsCanonicalizing([...KeyringManager::NOTIFICATIONS, 'verify_email', 'reset_password'], $groups->flatten()->all());

        $this->assertContains('second_factor_failed', $groups['Security alerts']);
        $this->assertContains('new_device', $groups['Security alerts']);
        $this->assertContains('password_changed', $groups['Confirmations']);
        $this->assertContains('verification_code', $groups['Emails a flow needs']);
        $this->assertSame(['verify_email', 'reset_password'], $groups["Laravel's emails"]);
    }

    public function test_the_plain_text_part_is_the_emails_own()
    {
        $text = (new EmailGallery)->text('new_device');

        $this->assertNotNull($text);
        $this->assertStringStartsWith(config('app.name')."\n\n", $text);
        $this->assertStringContainsString('Firefox on Windows', $text);
        $this->assertDoesNotMatchRegularExpression('/<[a-z][^>]*>/i', $text);
    }

    /**
     * The routes are only registered while running locally, so register
     * them again as they'd be there.
     */
    public function test_the_gallery_pages_while_running_locally()
    {
        $this->app['env'] = 'local';
        Route::middleware('web')->group(base_path('routes/web.php'));
        Route::getRoutes()->refreshNameLookups();

        $this->get('/emails')
            ->assertOk()
            ->assertSeeInOrder(EmailGallery::GROUPS)
            ->assertSee('data-email="new_device"', false);

        $this->get('/emails/new_device')->assertOk()->assertSee('<!DOCTYPE html>', false);

        $this->get('/emails/new_device/text')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/plain; charset=utf-8')
            ->assertSee('Firefox on Windows');

        $this->get('/emails/not_an_email')->assertNotFound();
    }
}
