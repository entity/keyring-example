<?php

namespace App\Notifications\Keyring;

class EmailChangeReverted extends SecurityNotice
{
    protected function subject(): string
    {
        return __('Your email address change was undone');
    }

    protected function intro(): string
    {
        return __('A change to the email address on your account was just undone, and you were signed out everywhere.');
    }
}
