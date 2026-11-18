<!--
  Sent to an address that already has an account when someone tries to move
  another account to it, instead of telling them it's taken.
-->
<template>
    <Shell
        preheader="Someone tried to use your email address. Nothing changed."
    >
        <template #footer>
            You're getting this email because someone tried to use this address
            for another account.
        </template>

        <NotPlaintext>
            <Hero tone="info" icon="at-sign"
                >Someone tried to use your email address</Hero
            >
        </NotPlaintext>
        <Plaintext>Someone tried to use your email address</Plaintext>

        <Lead>
            Someone tried to change another account's email address to this one.
            This address already has an account, so nothing was changed.
        </Lead>

        <template #aside>
            <Advice title="Was this you?">
                Sign in to your existing account instead. Otherwise, you can
                ignore this email.
            </Advice>
        </template>
    </Shell>
</template>
