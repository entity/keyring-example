<?php

namespace App\Notifications\Keyring;

class AuthenticatorRemoved extends SecurityNotice
{
    protected function subject(): string
    {
        return __('A sign-in method was removed');
    }

    protected function intro(): string
    {
        return __('":name" was removed from your account.', ['name' => $this->name]);
    }
}
