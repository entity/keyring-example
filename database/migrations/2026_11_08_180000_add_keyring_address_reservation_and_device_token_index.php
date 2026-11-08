<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Keyring\Models\PendingChange;

/**
 * Keyring's create migrations gained these after this app published them:
 * the hash that reserves an email change's old address while it can be
 * reverted, and an index for looking up a browser's device cookie.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('keyring_pending_changes', function (Blueprint $table) {
            $table->string('previous_value_hash', 64)->nullable()->index()->after('previous_value');
        });

        Schema::table('keyring_devices', function (Blueprint $table) {
            $table->index('token_hash');
        });

        // So changes made before this still reserve their old address.
        PendingChange::query()->whereNotNull('previous_value')->each(
            fn (PendingChange $change) => $change->forceFill(['previous_value_hash' => PendingChange::lookupHash($change->previous_value)])->saveQuietly(),
        );
    }

    public function down(): void
    {
        Schema::table('keyring_devices', function (Blueprint $table) {
            $table->dropIndex(['token_hash']);
        });

        Schema::table('keyring_pending_changes', function (Blueprint $table) {
            $table->dropIndex(['previous_value_hash']);
            $table->dropColumn('previous_value_hash');
        });
    }
};
