<?php

use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Changing how someone signs in, or deleting the account, needs a recent
    // verification. Keyring asks for a second factor when the user has one.
    Route::middleware('keyring.fresh:15m')->group(function () {
        Route::get('settings/security', [SecurityController::class, 'edit'])->name('security.edit');
        Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    });

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');
});

Route::get('.well-known/passkey-endpoints', fn () => response()->json([
    'enroll' => route('security.edit'),
    'manage' => route('security.edit'),
]))->name('well-known.passkeys');
