<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;
use Keyring\Contracts\Enrollable;
use Keyring\Devices\DeviceManager;
use Keyring\Facades\Keyring;
use Keyring\Models\Authenticator;
use Keyring\Models\SecurityEvent;
use Keyring\Sessions\SessionAssurance;
use Keyring\Sessions\Sessions;

class SecurityController extends Controller
{
    /**
     * Sign-in methods, devices, sessions and recent activity. Changes go
     * straight to Keyring's routes (/user/authenticators, /user/devices,
     * /user/sessions, /user/password).
     *
     * This is also where Keyring sends people who have something to do
     * first: set up a second factor (keyring.enrollment_url) or choose a new
     * password (keyring.password_change_url). The page says which.
     */
    public function edit(Request $request, DeviceManager $devices, Sessions $sessions, SessionAssurance $assurance): Response
    {
        $user = $request->user();

        return Inertia::render('settings/security', [
            'authenticators' => $user->keyring->all()
                ->reject(fn (Authenticator $authenticator) => $authenticator->isVirtual())
                ->map(fn (Authenticator $authenticator) => [
                    ...$authenticator->factor()->present($authenticator),
                    'isDefault' => $authenticator->is_default,
                ])
                ->values(),
            'enrollable' => Keyring::registered()
                ->filter(fn ($factor) => $factor instanceof Enrollable)
                ->map(fn ($factor) => $factor->key())
                ->values(),
            'devices' => $devices->list($request, $user),
            'sessions' => $sessions->list($request, $user),
            'activity' => Keyring::activity($user, 20)->map(fn (SecurityEvent $event) => [
                'id' => $event->id,
                'type' => $event->type,
                'severity' => $event->severity->value,
                'factor' => $event->factor,
                // What each entry has to say for itself ("Entry Types" in
                // Keyring's docs): the factors a sign in used, the method
                // that was added, why a session ended, what risk found...
                'meta' => Arr::only($event->meta ?? [], ['factors', 'name', 'count', 'remaining', 'reason', 'reasons', 'resource']),
                // Some entries name the device. The rest have the browser
                // they came from.
                'device' => $event->meta['device'] ?? Keyring::describeDevice($event->user_agent),
                'ip' => $event->ip,
                'at' => $event->created_at->toIso8601String(),
            ]),
            'assurance' => $assurance->level()->name,
            // Recovery codes and emailed codes don't count as one.
            'hasSecondFactor' => $user->keyring->hasSecondFactor(),
            'mustChangePassword' => Keyring::requiresPasswordChange($user),
        ]);
    }
}
