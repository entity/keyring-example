@php(ob_start())
@php($root = \Keyring\Facades\Keyring::linkRoot())

@php($images = $root.'/images/emails')

{!! config('app.name') !!}

Reset your password

We got a request to reset the password for your account. Choose a new one with the button below.

Reset password:
{!! $url !!}

This link expires in {!! $minutes !!} minutes.

Didn't ask for this?

You can ignore this email. Your password won't change unless the link is used.

@isset($contact)

If this wasn't you and you need help, contact us: {!! $contact !!}

@endisset

You're getting this email because someone asked to reset the password for this address.

{!! config('app.name') !!}

{!! $root !!}
{!! trim(preg_replace('/\n\s*\n/', "\n\n", ob_get_clean())) !!}
