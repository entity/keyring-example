@php(ob_start())
@php($root = \Keyring\Facades\Keyring::linkRoot())

@php($images = $root.'/images/emails')

{!! config('app.name') !!}

Someone tried to use your email address

Someone tried to change another account's email address to this one. This address already has an account, so nothing was changed.

Was this you?

Sign in to your existing account instead. Otherwise, you can ignore this email.

@isset($contact)

If this wasn't you and you need help, contact us: {!! $contact !!}

@endisset

You're getting this email because someone tried to use this address for another account.

{!! config('app.name') !!}

{!! $root !!}
{!! trim(preg_replace('/\n\s*\n/', "\n\n", ob_get_clean())) !!}
