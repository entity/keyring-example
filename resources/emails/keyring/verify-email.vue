<!--
  Laravel's email verification email, sent when someone registers. Built by
  App\Notifications\Keyring\LaravelMail::verifyEmail().
-->
<template>
    <Shell preheader="Confirm your email address to finish setting up.">
        <template #footer>
            You're getting this email because this address was used to create an
            account.
        </template>

        <NotPlaintext>
            <Hero tone="info" icon="mail-check">Verify your email address</Hero>
        </NotPlaintext>
        <Plaintext>Verify your email address</Plaintext>

        <Lead>
            Confirm this is your email address to finish setting up your
            account. This link expires in <Raw>{{ $minutes }}</Raw> minutes.
        </Lead>

        <Spacer class="h-8" />
        <Action href="{{ $url }}" fallback>Verify email address</Action>

        <template #aside>
            <Advice title="Didn't create an account?">
                You can ignore this email. Nothing happens unless the link is
                used.
            </Advice>
        </template>
    </Shell>
</template>
