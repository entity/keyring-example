<?php

use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Route;
use Keyring\Facades\Keyring;
use Keyring\KeyringManager;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

// While developing, see each of Keyring's emails in the browser with sample
// content: /emails lists them, /emails/new_device shows one.
if (app()->isLocal()) {
    Route::get('emails', fn () => collect(KeyringManager::NOTIFICATIONS)
        ->map(fn (string $type) => sprintf('<li><a href="%s">%s</a></li>', route('emails.show', $type), $type))
        ->prepend('<ul style="font: 16px/2 system-ui; padding: 2rem 3rem">')
        ->implode(''));

    Route::get('emails/{type}', function (string $type) {
        $notification = Keyring::requiredNotification($type, [
            'when' => now()->toDayDateTimeString(),
            'at' => now(),
            'device' => 'Firefox on Windows',
            'ip' => '203.0.113.7',
            'name' => 'YubiKey 5C',
            'remaining' => 7,
            'reasons' => 'Signing in from a new country (NL).',
            'url' => url('/'),
            'expiresAt' => now()->addDay(),
            'code' => '12345678',
            'minutes' => 10,
            'enrolling' => false,
            'email' => 'n•••@example.com',
            'revertUrl' => url('/'),
            'confirmUrl' => url('/'),
        ]);

        abort_unless(method_exists($notification, 'toMail'), 404);

        return $notification->toMail(new AnonymousNotifiable)->render();
    })
        ->whereIn('type', KeyringManager::NOTIFICATIONS)
        ->name('emails.show');
}

require __DIR__.'/settings.php';
