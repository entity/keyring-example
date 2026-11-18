@php(ob_start())
@php($images = asset('images/emails'))

{!! config('app.name') !!}

{!! $subject !!}

{!! $intro !!}

@if ($reasons !== [])

What we noticed

@foreach ($reasons as $reason)
- {!! $reason !!}
@endforeach

@endif

@if ($details !== [])

@foreach ($details as $detail)
{!! $detail['label'] !!}: {!! $detail['value'] !!}
@endforeach

@endif

@isset($actionUrl)

{!! $actionText !!}:
{!! $actionUrl !!}
@endisset

{!! $adviceTitle !!}

{!! $advice !!}

@isset($contact)

If this wasn't you and you need help, contact us: {!! $contact !!}

@endisset

You're getting this email because it's about the security of your account.

{!! config('app.name') !!}

{!! config('app.url') !!}
{!! trim(preg_replace('/\n\s*\n/', "\n\n", ob_get_clean())) !!}
