<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Keyring\Enums\Severity;
use Keyring\Models\PendingChange;

/**
 * Keyring's create migrations gained these after this app published them:
 * a severity and the request's ID on every security log entry, what a
 * session's record was replaced by (so "remember me" works once) and whether
 * it was remembered, and two new tables, one counting an authenticator's
 * failures in a row and one holding users until they choose a new password.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('keyring_events', function (Blueprint $table) {
            $table->string('severity', 16)->default('info')->after('type');
            // What one request wrote, read together.
            $table->string('request_id', 64)->nullable()->index()->after('user_agent');
        });

        Schema::table('keyring_sessions', function (Blueprint $table) {
            $table->string('replaced_by', 64)->nullable()->after('revoked_at');
            $table->unsignedInteger('replaced_at')->nullable()->after('replaced_by');
            $table->boolean('remembered')->default(false)->after('replaced_at');
        });

        Schema::create('keyring_failure_counts', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->morphs('authenticatable', 'keyring_failure_counts_owner_index');
            $table->string('factor', 64);
            // The authenticator's ID, or the factor's key for one with no
            // row of its own, like the password.
            $table->string('authenticator', 64);
            // Failures in a row from browsers the account hasn't signed in
            // from, and from those it has. Together they never pass the cap.
            $table->unsignedInteger('failures')->default(0);
            $table->unsignedInteger('known_failures')->default(0);
            // When each of the two was refused until the count is cleared.
            $table->timestamp('locked_at')->nullable();
            $table->timestamp('known_locked_at')->nullable();
            $table->timestamps();

            // One row per account and authenticator, so two first failures
            // at once can't each start a count.
            $table->unique(['authenticatable_type', 'authenticatable_id', 'authenticator'], 'keyring_failure_counts_authenticator_unique');
        });

        Schema::create('keyring_password_holds', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->morphs('authenticatable', 'keyring_password_holds_owner_index');
            $table->string('reason')->nullable();
            $table->timestamps();

            $table->unique(['authenticatable_type', 'authenticatable_id'], 'keyring_password_holds_owner_unique');
        });

        // Entries written before this get the severity their type has now.
        DB::table('keyring_events')->distinct()->pluck('type')->each(
            fn (string $type) => DB::table('keyring_events')->where('type', $type)->update(['severity' => Severity::of($type)->value]),
        );

        // Keyring now hashes with a key of its own for each purpose, so the
        // hash that reserves an email change's old address is made again.
        PendingChange::query()->whereNotNull('previous_value')->each(
            fn (PendingChange $change) => $change->forceFill(['previous_value_hash' => PendingChange::lookupHash($change->previous_value)])->saveQuietly(),
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('keyring_password_holds');
        Schema::dropIfExists('keyring_failure_counts');

        Schema::table('keyring_sessions', function (Blueprint $table) {
            $table->dropColumn(['replaced_by', 'replaced_at', 'remembered']);
        });

        Schema::table('keyring_events', function (Blueprint $table) {
            $table->dropIndex(['request_id']);
            $table->dropColumn(['severity', 'request_id']);
        });
    }
};
