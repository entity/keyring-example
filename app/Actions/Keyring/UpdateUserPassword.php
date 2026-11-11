<?php

declare(strict_types=1);

namespace App\Actions\Keyring;

use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Keyring\Contracts\UpdatesUserPasswords;

class UpdateUserPassword implements UpdatesUserPasswords
{
    use PasswordValidationRules;

    /**
     * Validate and update the signed-in user's password. Keyring has already
     * checked their current password (the request's current_password) when
     * they have one, and afterwards signs out their other sessions (unless
     * they unticked that) and cancels pending email changes.
     *
     * @param  User  $user
     * @param  array<string, mixed>  $input
     */
    public function update(Authenticatable&Model $user, array $input): void
    {
        $validated = Validator::make($input, [
            'password' => $this->passwordRules($user),
        ])->validate();

        $user->forceFill(['password' => Hash::make(Arr::string($validated, 'password'))])->save();
    }
}
