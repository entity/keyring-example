<?php

namespace App\Actions\Keyring;

use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Keyring\Contracts\CreatesNewUsers;
use Keyring\Facades\Keyring;
use Keyring\Rules\UnreservedAddress;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user. Keyring then signs them
     * in, counting the password they just chose as proved.
     *
     * @param  array<string, mixed>  $input
     */
    public function create(array $input): User
    {
        $input['email'] = is_string($input['email'] ?? null) ? Keyring::normalizeUsername($input['email']) : null;

        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class), new UnreservedAddress],
            'password' => $this->passwordRules(context: [$input['name'] ?? null, $input['email']]),
        ])->validate();

        return User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => Hash::make(Arr::string($input, 'password')),
        ]);
    }
}
