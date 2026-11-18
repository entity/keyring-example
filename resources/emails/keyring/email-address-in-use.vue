<!--
  Sent to an address that already has an account when someone tries to move
  another account to it, instead of telling them it's taken.
-->
<template>
    <Shell preheader="Someone tried to use your email address. Nothing changed.">
        <template #top><Accent tone="info" /></template>
        <template #footer>
            You're getting this email because someone tried to use this address
            for another account.
        </template>

        <NotPlaintext>
            <Hero tone="info" icon="at-sign" eyebrow="Nothing changed">
                Someone tried to use your email address
            </Hero>
        </NotPlaintext>
        <Plaintext>Someone tried to use your email address</Plaintext>

        <Lead>
            Someone tried to change another account's email address to this one.
            This address already has an account, so nothing was changed.
        </Lead>

        <Callout title="Was this you?">
            <Text class="m-0 text-sm/6">
                Sign in to your existing account instead. Otherwise, you can
                ignore this email.
            </Text>
        </Callout>
    </Shell>
</template>
