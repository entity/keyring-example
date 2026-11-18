<?php

use App\Http\Controllers\DemoStateController;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\URL;

Artisan::command('example:reset', function () {
    // Deleting a user removes their Keyring data too (sign-in methods,
    // devices, sessions, pending email changes).
    User::query()->whereIn('email', ['demo@keyring.test', '2fa@keyring.test'])->get()->each->delete();

    $this->call('db:seed', ['--class' => DatabaseSeeder::class]);
})->purpose('Put the two demo accounts back the way they started');

Artisan::command('example:links {--base= : Where the app is reached, if not APP_URL} {--hours=24 : How long the links work}', function () {
    abort_unless(app()->isLocal(), 1, 'The links only work with APP_ENV=local.');

    $base = rtrim($this->option('base') ?: config('app.url'), '/');
    $until = now()->addHours((int) $this->option('hours'));

    foreach (DemoStateController::STATES as $state => $about) {
        $this->line("<info>{$about}</info>");
        $this->line($base.URL::temporarySignedRoute('demo.state', $until, ['state' => $state], absolute: false));
        $this->newLine();
    }

    $this->comment("The links work until {$until->toDayDateTimeString()} UTC. Each one signs the browser out first.");
})->purpose('Print signed links straight into each state of the app, like halfway through a sign in');
