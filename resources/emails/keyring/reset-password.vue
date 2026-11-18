<!--
  Laravel's password reset email. Built by
  App\Notifications\Keyring\LaravelMail::resetPassword().
-->
<template>
    <Shell preheader="Choose a new password for your account.">
        <template #footer>
            You're getting this email because someone asked to reset the
            password for this address.
        </template>

        <NotPlaintext>
            <Hero tone="info" icon="lock-keyhole">Reset your password</Hero>
        </NotPlaintext>
        <Plaintext>Reset your password</Plaintext>

        <Lead>
            We got a request to reset the password for your account. Choose a
            new one with the button below. This link expires in
            <Raw>{{ $minutes }}</Raw> minutes.
        </Lead>

        <Spacer class="h-8" />
        <Action href="{{ $url }}" fallback>Reset password</Action>

        <template #aside>
            <Advice title="Didn't ask for this?">
                You can ignore this email. Your password won't change unless the
                link is used.
            </Advice>
        </template>
    </Shell>
</template>
