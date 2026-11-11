<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Keyring\Models\PendingChange;
use Keyring\Sessions\RegisteredSession;

/**
 * Keyring's create migrations gained this after this app published them: a
 * session's record says which table its user's ID is one of, so two user
 * models with the same IDs can't share sessions.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('keyring_sessions', function (Blueprint $table) {
            $table->string('user_type')->nullable()->after('user_id');
        });

        // This app has one user model, so every session so far is one of
        // its users' and nobody has to sign in again.
        DB::table('keyring_sessions')->update(['user_type' => RegisteredSession::typeOf(new User)]);

        Schema::table('keyring_sessions', function (Blueprint $table) {
            $table->string('user_type')->nullable(false)->change();
            $table->dropIndex(['user_id']);
            $table->index(['user_type', 'user_id']);
        });

        // A reserved address is folded further now ("ß" and a doubled "s"
        // are found as each other), so the hash it's found by is made again.
        PendingChange::query()->whereNotNull('previous_value')->each(
            fn (PendingChange $change) => $change->forceFill(['previous_value_hash' => PendingChange::lookupHash($change->previous_value)])->saveQuietly(),
        );
    }

    public function down(): void
    {
        Schema::table('keyring_sessions', function (Blueprint $table) {
            $table->dropIndex(['user_type', 'user_id']);
            $table->dropColumn('user_type');
            $table->index('user_id');
        });
    }
};
