<?php

declare(strict_types=1);

namespace App\Notifications\Keyring;

class SecondFactorFailed extends SecurityNotice
{
    protected function subject(): string
    {
        return __('Someone entered your password');
    }

    protected function intro(): string
    {
        return __('Someone signed in with your password but couldn\'t complete the second step. If this wasn\'t you, your password is probably known to someone else.');
    }
}
