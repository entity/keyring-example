<!--
  Every security notice: "your password was changed", "new sign-in" and the
  rest. App\Notifications\Keyring\NoticeMail gives each its tone, icon,
  details and advice, so one template covers all twelve.
-->
<template>
    <Shell>
        <template #preheader>
            <Preview
                ><Raw>{{ $preheader }}</Raw></Preview
            >
        </template>

        <NotPlaintext>
            <Hero tone="{{ $tone }}" icon="{{ $icon }}">
                <Raw>{{ $subject }}</Raw>
            </Hero>
        </NotPlaintext>
        <Plaintext
            ><Raw>{{ $subject }}</Raw></Plaintext
        >

        <Lead
            ><Raw>{{ $intro }}</Raw></Lead
        >

        <Raw>@if ($reasons !== [])</Raw>
        <Callout title="What we noticed">
            <Raw>@foreach ($reasons as $reason)</Raw>
            <NotPlaintext>
                <Text class="m-0 mt-1 text-[13px]/5">
                    <Raw>{{ $reason }}</Raw>
                </Text>
            </NotPlaintext>
            <Plaintext
                >- <Raw>{{ $reason }}</Raw></Plaintext
            >
            <Raw>@endforeach</Raw>
        </Callout>
        <Raw>@endif</Raw>

        <Details />

        <Raw>@isset($actionUrl)</Raw>
        <Spacer class="h-8" />
        <Action href="{{ $actionUrl }}" fallback>
            <Raw>{{ $actionText }}</Raw>
        </Action>
        <Raw>@endisset</Raw>

        <template #aside>
            <Advice>
                <template #title
                    ><Raw>{{ $adviceTitle }}</Raw></template
                >
                <Raw>{{ $advice }}</Raw>
            </Advice>
        </template>
    </Shell>
</template>
