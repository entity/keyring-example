<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Only needed with the "database" session registry driver.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('keyring_sessions', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('user_id')->index();
            $table->string('guard');
            $table->string('device_id', 26)->nullable()->index();
            $table->unsignedTinyInteger('assurance')->default(0);
            $table->string('ip', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->unsignedInteger('authenticated_at');
            $table->unsignedInteger('last_activity_at');
            $table->unsignedInteger('expires_at');
            $table->unsignedInteger('revoked_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('keyring_sessions');
    }
};
