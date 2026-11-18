<!--
  Laravel's email verification email, sent when someone registers. Built by
  App\Notifications\Keyring\LaravelMail::verifyEmail().
-->
<template>
    <Shell preheader="Confirm your email address to finish setting up.">
        <template #top><Accent tone="info" /></template>
        <template #footer>
            You're getting this email because this address was used to create
            an account.
        </template>

        <NotPlaintext>
            <Hero tone="info" icon="mail-check" eyebrow="Almost there">
                Verify your email address
            </Hero>
        </NotPlaintext>
        <Plaintext>Verify your email address</Plaintext>

        <Lead>
            Confirm this is your email address to finish setting up your
            account.
        </Lead>

        <Spacer class="h-8" />
        <Action href="{{ $url }}" fallback>Verify email address</Action>

        <Note>This link expires in <Raw>{{ $minutes }}</Raw> minutes.</Note>

        <Callout title="Didn't create an account?">
            <Text class="m-0 text-sm/6">
                You can ignore this email. Nothing happens unless the link is
                used.
            </Text>
        </Callout>
    </Shell>
</template>
