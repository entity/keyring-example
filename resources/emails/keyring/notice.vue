<!--
  Every security notice: "your password was changed", "new sign-in" and the
  rest. App\Notifications\Keyring\NoticeMail gives each its tone, icon,
  label, details and advice, so one template covers all twelve.
-->
<template>
    <Shell>
        <template #preheader>
            <Preheader><Raw>{{ $preheader }}</Raw></Preheader>
        </template>

        <template #top>
            <ToneSwitch v-slot="{ tone }">
                <Accent :tone="tone" />
            </ToneSwitch>
        </template>

        <NotPlaintext>
            <ToneSwitch v-slot="{ tone }">
                <Hero :tone="tone" icon="{{ $icon }}">
                    <template #eyebrow><Raw>{{ $eyebrow }}</Raw></template>
                    <Raw>{{ $subject }}</Raw>
                </Hero>
            </ToneSwitch>
        </NotPlaintext>
        <Plaintext><Raw>{{ $subject }}</Raw></Plaintext>

        <Lead><Raw>{{ $intro }}</Raw></Lead>

        <Raw>@if ($reasons !== [])</Raw>
        <Callout tone="warning" title="What we noticed">
            <Raw>@foreach ($reasons as $reason)</Raw>
            <NotPlaintext>
                <Text class="m-0 mt-1 text-sm/6">
                    &bull;&nbsp; <Raw>{{ $reason }}</Raw>
                </Text>
            </NotPlaintext>
            <Plaintext>- <Raw>{{ $reason }}</Raw></Plaintext>
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

        <Callout>
            <template #title><Raw>{{ $adviceTitle }}</Raw></template>
            <Text class="m-0 text-sm/6">
                <Raw>{{ $advice }}</Raw>
            </Text>
        </Callout>
    </Shell>
</template>
