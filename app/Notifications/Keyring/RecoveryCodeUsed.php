<?php

declare(strict_types=1);

namespace App\Notifications\Keyring;

class RecoveryCodeUsed extends SecurityNotice
{
    protected function subject(): string
    {
        return __('A recovery code was used');
    }

    protected function intro(): string
    {
        return __('A recovery code was used to sign in to your account. You have :remaining left.', ['remaining' => $this->remaining]);
    }
}
