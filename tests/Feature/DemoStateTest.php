<?php

namespace Tests\Feature;

use App\Http\Controllers\DemoStateController;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class DemoStateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);

        // The links are only there while running locally, so register the
        // routes again as they'd be there.
        $this->app['env'] = 'local';
        Route::middleware('web')->group(base_path('routes/web.php'));
        Route::getRoutes()->refreshNameLookups();
    }

    public function test_each_link_lands_where_it_says()
    {
        $lands = [
            'welcome' => '/',
            'login' => '/login',
            'register' => '/register',
            'forgot-password' => '/forgot-password',
            'challenge-app' => '/login/challenge/totp',
            'challenge-email' => '/login/challenge/email-code',
            'challenge-recovery' => '/login/challenge/recovery',
            'add-two-factor' => '/settings/security',
            'dashboard' => '/dashboard',
            'security' => '/settings/security',
            'confirm' => '/settings/security',
            'profile' => '/settings/profile',
            'emails' => '/emails',
            'reset' => '/login',
        ];

        $this->assertSame(array_keys(DemoStateController::STATES), array_keys($lands));

        foreach ($lands as $state => $path) {
            $this->get($this->link($state))->assertRedirect($path);
        }
    }

    public function test_a_challenge_link_waits_on_that_factor()
    {
        $this->get($this->link('challenge-app'));
        $this->assertGuest();

        $this->get('/login/challenge/totp')->assertOk()->assertInertia(fn ($page) => $page->where('factor', 'totp'));

        $this->get($this->link('challenge-email'));
        $this->get('/login/challenge/email-code')->assertOk()->assertInertia(fn ($page) => $page->where('factor', 'email-code'));
    }

    public function test_the_signed_in_links_reach_their_page()
    {
        $this->get($this->link('security'));
        $this->assertAuthenticatedAs(User::query()->where('email', '2fa@keyring.test')->sole());
        $this->get('/settings/security')->assertOk();

        // Proved an hour ago, so changing how they sign in asks again.
        $this->get($this->link('confirm'));
        $this->get('/settings/security')->assertRedirect('/confirm');

        $this->get($this->link('add-two-factor'));
        $this->assertAuthenticatedAs(User::query()->where('email', 'demo@keyring.test')->sole());
        $this->get('/dashboard')->assertRedirect('/settings/security');
    }

    public function test_a_link_needs_its_signature()
    {
        $this->get('/try/dashboard')->assertForbidden();
        $this->get('/try/not-a-state')->assertNotFound();
        $this->get(URL::temporarySignedRoute('demo.state', now()->subMinute(), ['state' => 'dashboard'], absolute: false))->assertForbidden();
        $this->assertGuest();
    }

    protected function link(string $state): string
    {
        return URL::temporarySignedRoute('demo.state', now()->addHour(), ['state' => $state], absolute: false);
    }
}
