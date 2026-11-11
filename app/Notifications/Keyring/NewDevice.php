<?php

declare(strict_types=1);

namespace App\Notifications\Keyring;

class NewDevice extends SecurityNotice
{
    protected function subject(): string
    {
        return __('New sign-in to your account');
    }

    protected function intro(): string
    {
        return __('Your account was just signed in to from a device we haven\'t seen before.');
    }

    protected function action(): ?string
    {
        return __('This wasn\'t me');
    }
}
