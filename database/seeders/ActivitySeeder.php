<?php

namespace Database\Seeders;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Str;
use Keyring\Enums\Severity;
use Keyring\Models\SecurityEvent;

/**
 * A month of history for the two-factor demo account, so Settings →
 * Security's recent activity reads like a real account's: everyday sign ins
 * on a laptop and a phone, setting up the authenticator app, a stranger with
 * the password being turned away, and the password change that followed.
 *
 * The entries are written the way Keyring writes them (type, factor, meta
 * and severity), and are all marked seen, so none of them come back as a
 * "Was this you?" alert at the next sign in.
 */
class ActivitySeeder
{
    protected const string MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

    protected const string IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';

    protected const string STRANGER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0';

    protected const string HOME = '81.2.69.142';

    protected const string MOBILE = '86.131.42.17';

    protected const string ABROAD = '185.220.101.47';

    public function run(User $user): void
    {
        $now = CarbonImmutable::now();

        $entries = [
            // Setting up the authenticator app a month ago.
            [$now->subDays(31)->setTime(19, 4), 'signed_in', null, ['factors' => ['password']], self::MAC, self::HOME],
            [$now->subDays(31)->setTime(19, 6), 'authenticator_added', 'totp', ['name' => 'Authenticator app'], self::MAC, self::HOME],
            [$now->subDays(31)->setTime(19, 6), 'recovery_codes_generated', 'recovery', [], self::MAC, self::HOME],
            [$now->subDays(27)->setTime(8, 51), 'signed_in', null, ['factors' => ['password', 'totp']], self::MAC, self::HOME],

            // A new phone.
            [$now->subDays(23)->setTime(12, 30), 'new_device', null, ['device' => 'Safari on iPhone'], self::IPHONE, self::MOBILE],
            [$now->subDays(23)->setTime(12, 30), 'signed_in', null, ['factors' => ['password', 'totp']], self::IPHONE, self::MOBILE],

            // Someone with a leaked password, at three in the morning.
            [$now->subDays(16)->setTime(3, 12), 'factor_failed', 'password', [], self::STRANGER, self::ABROAD],
            [$now->subDays(16)->setTime(3, 13), 'factor_failed', 'password', [], self::STRANGER, self::ABROAD],
            [$now->subDays(16)->setTime(3, 15), 'risk_step_up', null, ['reasons' => ['Signing in from a new device.', 'Signing in from a new country (DE).']], self::STRANGER, self::ABROAD],
            [$now->subDays(16)->setTime(3, 15), 'second_factor_failed', 'totp', [], self::STRANGER, self::ABROAD],

            // ...and the owner, the next morning.
            [$now->subDays(15)->setTime(8, 2), 'signed_in', null, ['factors' => ['password', 'totp']], self::MAC, self::HOME],
            [$now->subDays(15)->setTime(8, 4), 'confirmed', null, ['factors' => ['password', 'totp']], self::MAC, self::HOME],
            [$now->subDays(15)->setTime(8, 4), 'password_changed', null, [], self::MAC, self::HOME],
            [$now->subDays(15)->setTime(8, 4), 'sessions_revoked', null, ['count' => 1], self::MAC, self::HOME],

            // Everyday use since.
            [$now->subDays(9)->setTime(18, 40), 'signed_in', null, ['factors' => ['password', 'totp']], self::IPHONE, self::MOBILE],
            [$now->subDays(6)->setTime(23, 10), 'session_ended', null, ['reason' => 'idle'], self::IPHONE, self::MOBILE],
            [$now->subDays(4)->setTime(9, 15), 'signed_in', null, ['factors' => ['password', 'totp']], self::MAC, self::HOME],
            [$now->subDays(2)->setTime(17, 55), 'signed_out', null, [], self::MAC, self::HOME],
            [$now->subDay()->setTime(10, 20), 'signed_in', null, ['factors' => ['password', 'totp']], self::MAC, self::HOME],
        ];

        foreach ($entries as [$at, $type, $factor, $meta, $agent, $ip]) {
            SecurityEvent::query()->create([
                'authenticatable_type' => $user->getMorphClass(),
                'authenticatable_id' => $user->getKey(),
                'type' => $type,
                'severity' => Severity::of($type),
                'factor' => $factor,
                'ip' => $ip,
                'user_agent' => $agent,
                'request_id' => (string) Str::uuid(),
                'meta' => $meta === [] ? null : $meta,
                'seen_at' => $at,
                'created_at' => $at,
            ]);
        }
    }
}
