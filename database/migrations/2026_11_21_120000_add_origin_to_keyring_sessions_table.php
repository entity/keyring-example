<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The record a session started on, kept on every record it moves to, so the
 * session keeps its handle. Only needed with the "database" session registry
 * driver. Records from before it have none, and need none.
 */
return new class extends Migration
{
    public function getConnection(): ?string
    {
        return config('keyring.sessions.connection');
    }

    public function up(): void
    {
        Schema::table(config('keyring.sessions.table', 'keyring_sessions'), function (Blueprint $table) {
            $table->string('origin', 64)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table(config('keyring.sessions.table', 'keyring_sessions'), function (Blueprint $table) {
            $table->dropColumn('origin');
        });
    }
};
