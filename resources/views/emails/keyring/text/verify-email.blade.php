@php(ob_start())
@php($images = asset('images/emails'))

{!! config('app.name') !!}

Verify your email address

Confirm this is your email address to finish setting up your account.

Verify email address:
{!! $url !!}

This link expires in {!! $minutes !!} minutes.

Didn't create an account?

You can ignore this email. Nothing happens unless the link is used.

@isset($contact)

If this wasn't you and you need help, contact us: {!! $contact !!}

@endisset

You're getting this email because this address was used to create an account.

{!! config('app.name') !!}

{!! config('app.url') !!}
{!! trim(preg_replace('/\n\s*\n/', "\n\n", ob_get_clean())) !!}
