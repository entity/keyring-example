<?php

namespace App\Notifications\Keyring;

class EmailChanged extends SecurityNotice
{
    protected function subject(): string
    {
        return __('Your email address was changed');
    }

    protected function intro(): string
    {
        return __('The email address on your account was just changed. You now sign in and recover your account with the new address. To undo it, use the link in the email we sent to the old address when the change was requested.');
    }
}
