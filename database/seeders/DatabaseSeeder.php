<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Keyring\Models\Authenticator;

class DatabaseSeeder extends Seeder
{
    /**
     * The authenticator app secret for the two-factor demo account. Add it to
     * any authenticator app.
     */
    public const TOTP_SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

    /**
     * In the form Keyring makes them: 26 base32 characters (a-z and 2-7),
     * typed with or without the dashes. Anything shorter is refused.
     */
    public const RECOVERY_CODES = [
        'demo-code-aaaa-aaaa-aaaa-aaaa-aa',
        'demo-code-bbbb-bbbb-bbbb-bbbb-bb',
        'demo-code-cccc-cccc-cccc-cccc-cc',
        'demo-code-dddd-dddd-dddd-dddd-dd',
    ];

    public function run(): void
    {
        // Password only. Everyone needs a second factor here, so signing in
        // lands on Settings → Security until a passkey, a security key or an
        // authenticator app is added. Both accounts are verified (the factory
        // sees to that): an unverified one can't sign in at all.
        User::factory()->create([
            'name' => 'Demo User',
            'email' => 'demo@keyring.test',
        ]);

        // Already has an authenticator app and recovery codes, so signing in
        // asks for a second step. They're dated a month back: Keyring only
        // lets a second factor stand in for the old address's confirmation
        // of an email change once the account has had it a while
        // (keyring.email_changes.established_after, a week by default).
        $user = User::factory()->create([
            'name' => 'Two-Factor User',
            'email' => '2fa@keyring.test',
        ]);

        $established = ['created_at' => now()->subMonth()];

        Authenticator::factory()->totp(self::TOTP_SECRET)->default()->for($user, 'authenticatable')->create($established);
        Authenticator::factory()->recoveryCodes(self::RECOVERY_CODES)->for($user, 'authenticatable')->create($established);

        $this->command?->table(['Account', 'Password', 'Second factor'], [
            ['demo@keyring.test', 'password', 'none yet: signing in asks for one to be added'],
            ['2fa@keyring.test', 'password', 'TOTP secret '.self::TOTP_SECRET.', recovery codes '.implode(' ', self::RECOVERY_CODES)],
        ]);
    }
}
