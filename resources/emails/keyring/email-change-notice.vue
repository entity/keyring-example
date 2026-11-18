<!--
  Sent to the current address during an email change, with a link to cancel
  it. The change is confirmed from here too ($confirmUrl), unless whoever
  asked proved a second factor the account has had for a while.
-->
<template>
    <Shell
        preheader="Someone asked to change the email address on your account."
    >
        <NotPlaintext>
            <Hero tone="warning" icon="mail-warning"
                >Your email address is being changed</Hero
            >
        </NotPlaintext>
        <Plaintext>Your email address is being changed</Plaintext>

        <Lead>
            Someone asked to change the email address on your account to
            <Text
                as="span"
                class="font-semibold text-[#111010] dark:text-[#f1f2f4]"
                ><Raw>{{ $email }}</Raw></Text
            >.
        </Lead>

        <Raw>@isset($confirmUrl)</Raw>
        <Lead>To finish the change, confirm it from this address too.</Lead>
        <Spacer class="h-8" />
        <Action href="{{ $confirmUrl }}">Confirm the change</Action>
        <Raw>@endisset</Raw>

        <template #aside>
            <Advice title="Wasn't you?">
                Cancel the change and sign out everywhere, then change your
                password.
            </Advice>
            <NotPlaintext><Spacer class="h-5" /></NotPlaintext>
            <Action href="{{ $revertUrl }}" variant="secondary"
                >This wasn't me</Action
            >
        </template>
    </Shell>
</template>
