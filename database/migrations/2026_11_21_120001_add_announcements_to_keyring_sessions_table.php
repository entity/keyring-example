<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Keyring\Sessions\DatabaseSessionRegistry;

/**
 * What keyring:sweep needs to announce every session that ends: when each
 * record's end was announced, why it ended, how often a listener failed for
 * it and when to try again. Only needed with the "database" session
 * registry driver.
 *
 * Records revoked before now count as announced, so the first sweep doesn't
 * announce them again. Pruning keeps only the last day's, so that's one
 * small update, unless pruning has never run.
 */
return new class extends Migration
{
    public function getConnection(): ?string
    {
        return config('keyring.sessions.connection');
    }

    public function up(): void
    {
        $name = config('keyring.sessions.table', 'keyring_sessions');

        Schema::table($name, function (Blueprint $table) use ($name) {
            $table->unsignedInteger('announced_at')->nullable();
            $table->string('end_reason', 32)->nullable();
            $table->unsignedTinyInteger('announce_attempts')->default(0);
            $table->unsignedInteger('announce_after')->nullable();

            // What the sweep looks for, oldest first: records that expired,
            // records that idled out, and revocations not yet announced.
            $table->index(['revoked_at', 'replaced_by', 'expires_at'], $name.'_sweep_expired_index');
            $table->index(['revoked_at', 'replaced_by', 'remembered', 'last_activity_at'], $name.'_sweep_idle_index');
            $table->index(['announced_at', 'revoked_at'], $name.'_sweep_unannounced_index');
        });

        DB::connection($this->getConnection())->table($name)->whereNotNull('revoked_at')->update(['announced_at' => DB::raw('revoked_at')]);

        // Start noting at once, whatever the cache says.
        $this->forgetSchema($name);
    }

    public function down(): void
    {
        $name = config('keyring.sessions.table', 'keyring_sessions');

        Schema::table($name, function (Blueprint $table) use ($name) {
            $table->dropIndex($name.'_sweep_expired_index');
            $table->dropIndex($name.'_sweep_idle_index');
            $table->dropIndex($name.'_sweep_unannounced_index');
            $table->dropColumn(['announced_at', 'end_reason', 'announce_attempts', 'announce_after']);
        });

        // Stop noting at once, whatever the cache says. A process that has
        // found the columns still writes to them, fails, and revokes again
        // without them.
        $this->forgetSchema($name);
    }

    /**
     * Forget what the cache says about the table's columns, so the next
     * process to need them asks the database.
     */
    protected function forgetSchema(string $name): void
    {
        rescue(fn () => Cache::forget(DatabaseSessionRegistry::schemaCacheKey(DB::connection($this->getConnection()), $name)), report: false);
    }
};
