<?php

declare(strict_types=1);

namespace App\Notifications\Keyring;

use Illuminate\Support\Str;

/**
 * Where to reach the app's support, for the emails that end by saying so.
 * $contact is "support_contact" from config/keyring.php, which Keyring hands
 * every notification: a page's URL or an email address.
 */
trait ShowsSupportContact
{
    /**
     * What the templates need to show it: the text, and a link when it's an
     * address or a page. Anything else, like a phone number, is only text.
     *
     * @return array{contact: string|null, contactUrl: string|null}
     */
    protected function supportContact(): array
    {
        return [
            'contact' => $this->contact,
            'contactUrl' => match (true) {
                $this->contact === null => null,
                filter_var($this->contact, FILTER_VALIDATE_EMAIL) !== false => 'mailto:'.$this->contact,
                Str::startsWith($this->contact, ['https://', 'http://']) => $this->contact,
                default => null,
            },
        ];
    }
}
