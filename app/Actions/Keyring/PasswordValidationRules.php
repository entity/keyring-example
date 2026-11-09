<?php

namespace App\Actions\Keyring;

use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Keyring\Support\PasswordRules;

trait PasswordValidationRules
{
    /**
     * The rules for a new password, at registration, on change and on reset.
     * Keyring's are shorter with a second factor, refuse breached and common
     * passwords and ones with names in them, and never silently cut one off.
     * Adjust them here, for example:
     *
     *     PasswordRules::for($user, fn (Password $rule) => $rule->mixedCase())
     *
     * @param  User|null  $user  null at registration
     * @param  list<mixed>  $context  words it mustn't contain while there's no user yet (non-strings are ignored)
     * @return list<mixed>
     */
    protected function passwordRules((Authenticatable&Model)|null $user = null, array $context = []): array
    {
        return PasswordRules::for($user, context: $context);
    }
}
