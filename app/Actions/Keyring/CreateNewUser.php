<?php

namespace App\Actions\Keyring;

use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Keyring\Contracts\CreatesNewUsers;
use Keyring\Support\PasswordRules;

class CreateNewUser implements CreatesNewUsers
{
    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, mixed>  $input
     */
    public function create(array $input): User
    {
        $input['email'] = Str::lower(trim((string) ($input['email'] ?? '')));

        validator($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)],
            'password' => PasswordRules::for(),
        ])->validate();

        return User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
        ]);
    }
}
