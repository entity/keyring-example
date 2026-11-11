<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Where to reach the app's support, for the emails that end by saying so.
 * Keyring hands every notification "support_contact" from config/keyring.php
 * as $contact: a page's URL or an email address.
 */
final class SupportContact
{
    /**
     * What the templates need to show it: the text, and a link when it's an
     * address or a page. Anything else, like a phone number, is only text.
     *
     * @return array{contact: string|null, contactUrl: string|null}
     */
    public static function for(?string $contact): array
    {
        return [
            'contact' => $contact,
            'contactUrl' => match (true) {
                $contact === null => null,
                filter_var($contact, FILTER_VALIDATE_EMAIL) !== false => 'mailto:'.$contact,
                Str::startsWith($contact, ['https://', 'http://']) => $contact,
                default => null,
            },
        ];
    }
}
