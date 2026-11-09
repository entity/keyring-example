<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Keyring's create migrations gained these after this app published them:
 * when the session asking for an email change signed in (so undoing the
 * change also removes what that session added), room for longer WebAuthn
 * credential IDs, and indexes for pruning sessions and counting recent events.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('keyring_pending_changes', function (Blueprint $table) {
            $table->timestamp('signed_in_at')->nullable()->after('cancelled_at');
        });

        Schema::table('keyring_authenticators', function (Blueprint $table) {
            $table->string('credential_id', 512)->nullable()->change();
        });

        Schema::table('keyring_sessions', function (Blueprint $table) {
            $table->index('expires_at');
        });

        Schema::table('keyring_events', function (Blueprint $table) {
            $table->index(['authenticatable_type', 'authenticatable_id', 'type', 'created_at'], 'keyring_events_owner_type_index');
        });
    }

    public function down(): void
    {
        Schema::table('keyring_events', function (Blueprint $table) {
            $table->dropIndex('keyring_events_owner_type_index');
        });

        Schema::table('keyring_sessions', function (Blueprint $table) {
            $table->dropIndex(['expires_at']);
        });

        Schema::table('keyring_authenticators', function (Blueprint $table) {
            $table->string('credential_id')->nullable()->change();
        });

        Schema::table('keyring_pending_changes', function (Blueprint $table) {
            $table->dropColumn('signed_in_at');
        });
    }
};
