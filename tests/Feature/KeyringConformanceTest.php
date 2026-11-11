<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Keyring\Testing\KeyringConformance;
use Tests\TestCase;

/**
 * Keyring's own checks, run against this app's setup: its policy, factors,
 * registration action, routes and hasher. A check that's skipped is for a
 * feature the app doesn't use, not a pass.
 */
class KeyringConformanceTest extends TestCase
{
    use KeyringConformance, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Beginning to enroll email codes sends one.
        Notification::fake();
    }

    /**
     * A verified user whose password is "password", with no extra factors.
     */
    protected function keyringUser(): User
    {
        return User::factory()->create(['password' => 'password', 'email_verified_at' => now()]);
    }
}
