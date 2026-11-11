{!! config('app.name') !!}

Your verification code

Enter this code to finish. It expires in {!! $minutes !!} minutes.

{!! $code !!}

@if ($enrolling) If you didn't ask to add this email as a sign-in method, someone may be signed in to your account. Please change your password. @else If you didn't try to sign in, someone may know your password. Please change it. @endif

@isset($contact)

If this wasn't you and you need help, contact us: {!! $contact !!}

@endisset

You're getting this email because it's about the security of your account.