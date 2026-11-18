@php(ob_start())
@php($root = \Keyring\Facades\Keyring::linkRoot())

@php($images = $root.'/images/emails')

{!! config('app.name') !!}

You already have an account

Someone tried to create an account with this email address. It already has one, so nothing was created or changed.

Sign in:
{!! $loginUrl !!}
@isset($resetUrl)

Forgotten your password? Reset your password:
{!! $resetUrl !!}

@endisset

Wasn't you?

You can ignore this email. Your account hasn't changed.

@isset($contact)

If this wasn't you and you need help, contact us: {!! $contact !!}

@endisset

You're getting this email because someone tried to register with this address.

{!! config('app.name') !!}

{!! $root !!}
{!! trim(preg_replace('/\n\s*\n/', "\n\n", ob_get_clean())) !!}
