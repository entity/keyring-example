<!--
  Sent to the current address during an email change, with a link to cancel
  it. The change is confirmed from here too ($confirmUrl), unless whoever
  asked proved a second factor the account has had for a while.
-->
<template>
    <Shell
        preheader="Someone asked to change the email address on your account."
    >
        <template #top><Accent tone="warning" /></template>

        <NotPlaintext>
            <Hero
                tone="warning"
                icon="mail-warning"
                eyebrow="Email change requested"
            >
                Your email address is being changed
            </Hero>
        </NotPlaintext>
        <Plaintext>Your email address is being changed</Plaintext>

        <Lead>
            Someone asked to change the email address on your account to
            <Text as="span" class="font-semibold text-zinc-950 dark:text-zinc-50"
                ><Raw>{{ $email }}</Raw></Text
            >.
        </Lead>

        <Raw>@isset($confirmUrl)</Raw>
        <Lead>To finish the change, confirm it from this address too.</Lead>
        <Spacer class="h-6" />
        <Action href="{{ $confirmUrl }}">Confirm the change</Action>
        <Raw>@endisset</Raw>

        <Callout tone="warning" title="Wasn't you?">
            <Text class="m-0 text-sm/6">
                Cancel the change and sign out everywhere, then change your
                password.
            </Text>
            <Spacer class="h-4" />
            <Action href="{{ $revertUrl }}" variant="secondary"
                >This wasn't me</Action
            >
        </Callout>
    </Shell>
</template>
