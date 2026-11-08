<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Keyring\Contracts\Enrollable;
use Keyring\Devices\DeviceManager;
use Keyring\Facades\Keyring;
use Keyring\Models\Authenticator;
use Keyring\Models\SecurityEvent;
use Keyring\Session\SessionAssurance;

class SecurityController extends Controller
{
    /**
     * Sign-in methods, devices and recent activity. Changes go straight to
     * Keyring's routes (/user/authenticators, /user/devices, /user/password).
     */
    public function edit(Request $request, DeviceManager $devices, SessionAssurance $assurance): Response
    {
        $user = $request->user();

        return Inertia::render('settings/security', [
            'authenticators' => $user->keyring->all()
                ->reject(fn (Authenticator $authenticator) => $authenticator->isVirtual())
                ->map(fn (Authenticator $authenticator) => [
                    ...$authenticator->factor()->present($authenticator),
                    'isDefault' => $authenticator->is_default,
                    'createdAt' => $authenticator->created_at?->toIso8601String(),
                    'lastUsedAt' => $authenticator->last_used_at?->toIso8601String(),
                ])
                ->values(),
            'enrollable' => Keyring::registered()
                ->filter(fn ($factor) => $factor instanceof Enrollable)
                ->map(fn ($factor) => $factor->key())
                ->values(),
            'devices' => $devices->list($request, $user),
            'activity' => Keyring::activity($user, 15)->map(fn (SecurityEvent $event) => [
                'id' => $event->id,
                'type' => $event->type,
                'factor' => $event->factor,
                'ip' => $event->ip,
                'at' => $event->created_at->toIso8601String(),
            ]),
            'assurance' => $assurance->level()->name,
        ]);
    }
}
