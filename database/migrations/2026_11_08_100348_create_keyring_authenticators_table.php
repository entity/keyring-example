<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('keyring_authenticators', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->morphs('authenticatable', 'keyring_authenticators_owner_index');
            $table->string('factor', 64);
            $table->string('name');
            $table->text('secret')->nullable();
            $table->string('credential_id')->nullable()->unique();
            $table->text('public_key')->nullable();
            $table->unsignedBigInteger('sign_count')->default(0);
            $table->uuid('aaguid')->nullable();
            $table->json('transports')->nullable();
            $table->json('meta')->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->index(['authenticatable_type', 'authenticatable_id', 'factor'], 'keyring_authenticators_owner_factor_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('keyring_authenticators');
    }
};
