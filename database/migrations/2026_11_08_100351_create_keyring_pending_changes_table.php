<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('keyring_pending_changes', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->morphs('authenticatable', 'keyring_pending_changes_owner_index');
            $table->string('attribute', 64);
            $table->text('value');
            $table->text('previous_value')->nullable();
            $table->string('confirm_token', 64);
            $table->string('current_token', 64)->nullable();
            $table->string('revert_token', 64);
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('current_confirmed_at')->nullable();
            $table->timestamp('applied_at')->nullable();
            $table->timestamp('reverted_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('expires_at');
            $table->timestamp('revertable_until')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('keyring_pending_changes');
    }
};
