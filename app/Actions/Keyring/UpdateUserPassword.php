<?php

namespace App\Actions\Keyring;

use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Keyring\Contracts\UpdatesUserPasswords;

class UpdateUserPassword implements UpdatesUserPasswords
{
    use PasswordValidationRules;

    /**
     * Validate and update the signed-in user's password. Keyring then signs
     * out their other sessions (unless they unticked that) and cancels
     * pending email changes.
     *
     * @param  User  $user
     * @param  array<string, mixed>  $input
     */
    public function update(Authenticatable&Model $user, array $input): void
    {
        Validator::make($input, [
            // Covers a session left open on a shared computer. Users who sign
            // in with passkeys only have no password to type.
            'current_password' => filled($user->getAuthPassword())
                ? ['required', 'string', 'current_password:'.config('keyring.guard')]
                : ['nullable'],
            'password' => $this->passwordRules($user),
        ])->validate();

        $user->forceFill(['password' => Hash::make($input['password'])])->save();
    }
}
