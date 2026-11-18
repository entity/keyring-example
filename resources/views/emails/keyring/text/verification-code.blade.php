@php(ob_start())
@php($root = \Keyring\Facades\Keyring::linkRoot())

@php($images = $root.'/images/emails')

{!! config('app.name') !!}

Your verification code
@if ($enrolling)

Enter this code to finish adding your email address as a way to sign in. It expires in {!! $minutes !!} minutes.

@else

Enter this code to finish signing in. It expires in {!! $minutes !!} minutes.

@endif
Your code: {!! $code !!}

Don't share this code with anyone. We'll never ask you for it.

@if ($enrolling)

Didn't ask for this?

Someone may be signed in to your account. Change your password and check your sign-in methods straight away.

@else

Didn't try to sign in?

Someone may know your password. Change it straight away.

@endif

@isset($contact)

If this wasn't you and you need help, contact us: {!! $contact !!}

@endisset

You're getting this email because it's about the security of your account.

{!! config('app.name') !!}

{!! $root !!}
{!! trim(preg_replace('/\n\s*\n/', "\n\n", ob_get_clean())) !!}
