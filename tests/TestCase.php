<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Keyring\Testing\InteractsWithKeyring;

abstract class TestCase extends BaseTestCase
{
    use InteractsWithKeyring;

    protected function setUp(): void
    {
        parent::setUp();

        // Don't call the breached-password API from tests.
        config(['keyring.passwords.uncompromised' => false]);

        // Pages render without a Vite build.
        $this->withoutVite();
    }
}
