<!--
  Sent to an address that already has an account when someone tries to
  register with it, instead of telling them on the form that it's taken.
-->
<template>
    <Shell preheader="Someone tried to create an account with this address.">
        <template #top><Accent tone="info" /></template>
        <template #footer>
            You're getting this email because someone tried to register with
            this address.
        </template>

        <NotPlaintext>
            <Hero tone="info" icon="user-round-check" eyebrow="Welcome back">
                You already have an account
            </Hero>
        </NotPlaintext>
        <Plaintext>You already have an account</Plaintext>

        <Lead>
            Someone tried to create an account with this email address. It
            already has one, so nothing was created or changed.
        </Lead>

        <Spacer class="h-8" />
        <Action href="{{ $loginUrl }}">Sign in</Action>

        <Raw>@isset($resetUrl)</Raw>
        <Note>Forgotten your password?</Note>
        <Spacer class="h-3" />
        <Action href="{{ $resetUrl }}" variant="secondary"
            >Reset your password</Action
        >
        <Raw>@endisset</Raw>

        <Callout title="Wasn't you?">
            <Text class="m-0 text-sm/6">
                You can ignore this email. Your account hasn't changed.
            </Text>
        </Callout>
    </Shell>
</template>
