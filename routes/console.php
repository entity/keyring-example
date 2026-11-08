<?php

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Artisan;

Artisan::command('example:reset', function () {
    // Deleting a user removes their Keyring data too (sign-in methods,
    // devices, sessions, pending email changes).
    User::query()->whereIn('email', ['demo@keyring.test', '2fa@keyring.test'])->get()->each->delete();

    $this->call('db:seed', ['--class' => DatabaseSeeder::class]);
})->purpose('Put the two demo accounts back the way they started');
