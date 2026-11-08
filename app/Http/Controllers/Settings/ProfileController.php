<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Keyring\Changes\EmailChanges;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request, EmailChanges $changes): Response
    {
        $pending = $changes->pending($request->user());

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'pendingEmail' => $pending === null ? null : [
                'email' => $pending->value,
                'confirmed' => $pending->confirmed_at !== null,
                'needsCurrentConfirmation' => $pending->needsCurrentConfirmation(),
                'expiresAt' => $pending->expires_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Update the user's name. The email address is protected by Keyring and
     * changes through its confirmed flow (POST /user/email) instead.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

    /**
     * Delete the user's account. Keyring removes their sign-in methods,
     * devices and sessions along with it.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
