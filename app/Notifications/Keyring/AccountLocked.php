<?php

declare(strict_types=1);

namespace App\Notifications\Keyring;

class AccountLocked extends SecurityNotice
{
    protected function subject(): string
    {
        return __('Your account is locked');
    }

    protected function intro(): string
    {
        return __('Too many failed attempts to sign in have locked your account. Reset your password to unlock it.');
    }

    protected function action(): ?string
    {
        return __('Reset your password');
    }
}
