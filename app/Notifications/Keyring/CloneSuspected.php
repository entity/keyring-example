<?php

declare(strict_types=1);

namespace App\Notifications\Keyring;

class CloneSuspected extends SecurityNotice
{
    protected function subject(): string
    {
        return __('A security key may have been copied');
    }

    protected function intro(): string
    {
        return __('":name" answered with an out-of-date counter, which can mean it was copied. We refused the sign-in.', ['name' => $this->name]);
    }
}
