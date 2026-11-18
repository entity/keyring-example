@php(ob_start())
@php($root = \Keyring\Facades\Keyring::linkRoot())

@php($images = $root.'/images/emails')

{!! config('app.name') !!}

Your email address is being changed

Someone asked to change the email address on your account to {!! $email !!}.

@isset($confirmUrl)

To finish the change, confirm it from this address too.

Confirm the change:
{!! $confirmUrl !!}
@endisset

Wasn't you?

Cancel the change and sign out everywhere, then change your password.

This wasn't me:
{!! $revertUrl !!}

@isset($contact)

If this wasn't you and you need help, contact us: {!! $contact !!}

@endisset

You're getting this email because it's about the security of your account.

{!! config('app.name') !!}

{!! $root !!}
{!! trim(preg_replace('/\n\s*\n/', "\n\n", ob_get_clean())) !!}
