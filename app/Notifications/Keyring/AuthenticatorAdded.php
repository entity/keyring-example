<?php

declare(strict_types=1);

namespace App\Notifications\Keyring;

class AuthenticatorAdded extends SecurityNotice
{
    protected function subject(): string
    {
        return __('A sign-in method was added');
    }

    protected function intro(): string
    {
        return __('":name" was added as a way to sign in to your account.', ['name' => $this->name]);
    }
}
