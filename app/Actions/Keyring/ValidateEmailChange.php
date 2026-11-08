<?php

namespace App\Actions\Keyring;

use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Validator;
use Keyring\Contracts\ValidatesEmailChanges;
use Keyring\Facades\Keyring;

class ValidateEmailChange implements ValidatesEmailChanges
{
    /**
     * Validate a request to change the user's email address, and return the
     * new address. Keyring confirms it with both addresses before it applies.
     * Don't check here whether the address is taken: Keyring answers the same
     * way either way, so nobody can find out who has an account.
     *
     * @param  User  $user
     * @param  array<string, mixed>  $input
     */
    public function validate(Authenticatable&Model $user, array $input): string
    {
        $input['email'] = Keyring::normalizeUsername((string) ($input['email'] ?? ''));

        Validator::make($input, [
            'email' => ['required', 'string', 'email', 'max:255'],
        ])->validate();

        return $input['email'];
    }
}
