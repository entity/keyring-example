<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_a_successful_response()
    {
        $response = $this->get(route('home'));

        $response->assertOk();
    }

    /**
     * The front page introduces the two seeded accounts, with the
     * authenticator app secret as a QR code too.
     */
    public function test_the_welcome_page_has_the_demo_accounts()
    {
        $this->get(route('home'))->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->where('demoAccounts.password', 'password')
            ->where('demoAccounts.totpSecret', DatabaseSeeder::TOTP_SECRET)
            ->where('demoAccounts.recoveryCode', DatabaseSeeder::RECOVERY_CODES[0])
            ->where('demoAccounts.totpQr', fn (string $svg) => str_starts_with($svg, '<svg')));
    }
}
