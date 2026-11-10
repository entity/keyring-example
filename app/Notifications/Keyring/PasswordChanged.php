<?php

namespace App\Notifications\Keyring;

class PasswordChanged extends SecurityNotice
{
    protected function subject(): string
    {
        return __('Your password was changed');
    }

    protected function intro(): string
    {
        return __('The password for your account was just changed.');
    }
}
