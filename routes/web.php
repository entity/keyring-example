<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DemoLocationController;
use App\Http\Controllers\DemoStateController;
use App\Http\Controllers\WelcomeController;
use App\Support\EmailGallery;
use Illuminate\Support\Facades\Route;

Route::get('/', WelcomeController::class)->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
});

// The login page's "Pretend to be in" picker, with KEYRING_LOCATOR=demo.
Route::post('demo-location', DemoLocationController::class)->name('demo-location');

// While developing, see every email the app sends in the browser, with
// sample content: /emails is a gallery of them, /emails/new_device shows one
// and /emails/new_device/text its plain text part.
if (app()->isLocal()) {
    // Signed, expiring links straight into one state of the app, like halfway
    // through a sign in: `php artisan example:links` prints them.
    Route::get('try/{state}', DemoStateController::class)
        ->middleware('signed:relative')
        ->whereIn('state', array_keys(DemoStateController::STATES))
        ->name('demo.state');

    $gallery = new EmailGallery;

    Route::get('emails', fn () => view('emails.gallery', ['groups' => $gallery->groups()]))
        ->name('emails.index');

    Route::get('emails/{type}', fn (string $type) => $gallery->sample($type)->render())
        ->whereIn('type', $gallery->types())
        ->name('emails.show');

    Route::get('emails/{type}/text', function (string $type) use ($gallery) {
        $text = $gallery->text($type);

        abort_if($text === null, 404);

        return response($text)->header('Content-Type', 'text/plain; charset=utf-8');
    })
        ->whereIn('type', $gallery->types())
        ->name('emails.text');
}

require __DIR__.'/settings.php';
