<?php

namespace App\Notifications\Keyring;

class SuspiciousActivity extends SecurityNotice
{
    protected function subject(): string
    {
        return __('Unusual activity on your account');
    }

    protected function intro(): string
    {
        return __('We noticed something unusual and asked for extra verification: :reasons', ['reasons' => $this->reasons]);
    }
}
