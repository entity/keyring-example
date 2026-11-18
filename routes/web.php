<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DemoLocationController;
use App\Http\Controllers\WelcomeController;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Route;
use Keyring\Facades\Keyring;
use Keyring\KeyringManager;

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
    $sample = function (string $type): MailMessage {
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
    };

    $types = [...KeyringManager::NOTIFICATIONS, 'verify_email', 'reset_password'];

    // Grouped the way the gallery shows them. Only Keyring's security notices
    // are given a tone (by NoticeMail), which tells alerts from confirmations.
    $group = fn (string $type, MailMessage $mail) => match (true) {
        in_array($type, ['verify_email', 'reset_password']) => "Laravel's emails",
        ! isset($mail->viewData['tone']) => 'Emails a flow needs',
        in_array($mail->viewData['tone'], ['critical', 'warning']) => 'Security alerts',
        default => 'Confirmations',
    };

    Route::get('emails', fn () => view('emails.gallery', [
        'groups' => collect($types)
            ->map(fn (string $type) => ['type' => $type, 'mail' => $sample($type)])
            ->groupBy(fn (array $email) => $group($email['type'], $email['mail']))
            ->sortKeysUsing(fn (string $a, string $b) => array_search($a, $order = ['Security alerts', 'Confirmations', 'Emails a flow needs', "Laravel's emails"]) <=> array_search($b, $order)),
    ]))->name('emails.index');

    Route::get('emails/{type}', fn (string $type) => $sample($type)->render())
        ->whereIn('type', $types)
        ->name('emails.show');

    Route::get('emails/{type}/text', function (string $type) use ($sample) {
        $mail = $sample($type);
        $view = is_array($mail->view) ? $mail->view['text'] ?? null : null;

        abort_unless(is_string($view) && view()->exists($view), 404);

        return response(view($view, $mail->viewData)->render())->header('Content-Type', 'text/plain; charset=utf-8');
    })
        ->whereIn('type', $types)
        ->name('emails.text');
}

require __DIR__.'/settings.php';
