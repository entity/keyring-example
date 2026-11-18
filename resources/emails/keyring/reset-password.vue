<!--
  Laravel's password reset email. Built by
  App\Notifications\Keyring\LaravelMail::resetPassword().
-->
<template>
    <Shell preheader="Choose a new password for your account.">
        <template #top><Accent tone="info" /></template>
        <template #footer>
            You're getting this email because someone asked to reset the
            password for this address.
        </template>

        <NotPlaintext>
            <Hero tone="info" icon="lock-keyhole" eyebrow="Password reset">
                Reset your password
            </Hero>
        </NotPlaintext>
        <Plaintext>Reset your password</Plaintext>

        <Lead>
            We got a request to reset the password for your account. Choose a
            new one with the button below.
        </Lead>

        <Spacer class="h-8" />
        <Action href="{{ $url }}" fallback>Reset password</Action>

        <Note
            >This link expires in <Raw>{{ $minutes }}</Raw> minutes.</Note
        >

        <Callout title="Didn't ask for this?">
            <Text class="m-0 text-sm/6">
                You can ignore this email. Your password won't change unless the
                link is used.
            </Text>
        </Callout>
    </Shell>
</template>
