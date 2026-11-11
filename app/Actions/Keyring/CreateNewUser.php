<?php

declare(strict_types=1);

namespace App\Actions\Keyring;

use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Keyring\Contracts\CreatesNewUsers;
use Keyring\Facades\Keyring;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate a registration. Don't check here whether the address is
     * taken: Keyring does, once this has passed, and by default answers the
     * same way either way, so nobody can use the form to find out who has
     * an account.
     *
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function validate(array $input): array
    {
        $input['email'] = is_string($input['email'] ?? null) ? Keyring::normalizeUsername($input['email']) : null;

        return Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => $this->passwordRules(context: [$input['name'] ?? null, $input['email']]),
        ])->validate();
    }

    /**
     * Create the user from what validate() returned. Keyring only calls
     * this for an address nobody has.
     *
     * @param  array<string, mixed>  $input
     */
    public function create(array $input): User
    {
        return User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => Hash::make(Arr::string($input, 'password')),
        ]);
    }
}
