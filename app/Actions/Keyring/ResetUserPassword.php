<?php

namespace App\Actions\Keyring;

use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Keyring\Contracts\ResetsUserPasswords;

class ResetUserPassword implements ResetsUserPasswords
{
    use PasswordValidationRules;

    /**
     * Validate and reset the user's forgotten password. Keyring then signs
     * out every session, cancels pending email changes and lifts risk locks.
     *
     * @param  User  $user
     * @param  array<string, mixed>  $input
     */
    public function reset(Authenticatable&Model $user, array $input): void
    {
        Validator::make($input, [
            'password' => $this->passwordRules($user),
        ])->validate();

        $user->forceFill(['password' => Hash::make($input['password'])])->save();
    }
}
