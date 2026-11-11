<?php

declare(strict_types=1);

namespace App\Notifications\Keyring;

class RecoveryCodesGenerated extends SecurityNotice
{
    protected function subject(): string
    {
        return __('New recovery codes were made for your account');
    }

    protected function intro(): string
    {
        return __('A new set of recovery codes was made for your account. Any codes you saved before no longer work.');
    }
}
