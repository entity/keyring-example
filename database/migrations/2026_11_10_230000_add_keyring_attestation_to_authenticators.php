<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Keyring's create migration gained this after this app published it: the
 * attestation type that was checked when a security key was added, for a
 * factor set up with requireAttestation(). Null when nothing was checked.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('keyring_authenticators', function (Blueprint $table) {
            $table->string('attestation', 16)->nullable()->after('aaguid');
        });
    }

    public function down(): void
    {
        Schema::table('keyring_authenticators', function (Blueprint $table) {
            $table->dropColumn('attestation');
        });
    }
};
