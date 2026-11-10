{!! config('app.name') !!}

Your email address is being changed

Someone asked to change the email address on your account to {!! $email !!}.

@isset($confirmUrl)

To finish the change, confirm it from this address too.

Confirm the change

{!! $confirmUrl !!}

@endisset

Wasn't you? Cancel the change and sign out everywhere:

This wasn't me

{!! $revertUrl !!}

You're getting this email because it's about the security of your account.