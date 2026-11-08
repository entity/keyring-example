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
     * Keyring's follow OWASP: shorter with MFA, breached passwords refused,
     * nothing silently cut off. Adjust them here, for example:
     *
     *     PasswordRules::for($user, fn (Password $rule) => $rule->mixedCase())
     *
     * @param  User|null  $user  null at registration
     * @return list<mixed>
     */
    protected function passwordRules((Authenticatable&Model)|null $user = null): array
    {
        return PasswordRules::for($user);
    }
}
