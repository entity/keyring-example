@php(ob_start())
@php($images = asset('images/emails'))

{!! config('app.name') !!}

Confirm your new email address

Someone asked to use this address for their account. If that was you, confirm it to finish the change.

Confirm email address:
{!! $url !!}

This link expires {!! $expires !!}.

Didn't ask for this?

You can ignore this email. Nothing changes unless the link is used.

@isset($contact)

If this wasn't you and you need help, contact us: {!! $contact !!}

@endisset

You're getting this email because someone asked to use this address for their account.

{!! config('app.name') !!}

{!! config('app.url') !!}
{!! trim(preg_replace('/\n\s*\n/', "\n\n", ob_get_clean())) !!}
