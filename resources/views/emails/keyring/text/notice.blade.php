{!! config('app.name') !!}

{!! $subject !!}

{!! $intro !!}

@if ($details !== [])

@foreach ($details as $detail)

{!! $detail['label'] !!}

{!! $detail['value'] !!}

@endforeach

@endif @isset($actionUrl)

{!! $actionText !!}

{!! $actionUrl !!}

@endisset

If this wasn't you, change your password and check your sign-in methods straight away.

@isset($contact)

If this wasn't you and you need help, contact us: {!! $contact !!}

@endisset

You're getting this email because it's about the security of your account.