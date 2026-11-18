<!-- Sent to the new address during an email change: confirm it's yours. -->
<template>
    <Shell preheader="Confirm this is your new email address.">
        <template #footer>
            You're getting this email because someone asked to use this address
            for their account.
        </template>

        <NotPlaintext>
            <Hero tone="info" icon="mail-check"
                >Confirm your new email address</Hero
            >
        </NotPlaintext>
        <Plaintext>Confirm your new email address</Plaintext>

        <Lead>
            Someone asked to use this address for their account. If that was
            you, confirm it to finish the change. This link expires
            <Raw>{{ $expires }}.</Raw>
        </Lead>

        <Spacer class="h-8" />
        <Action href="{{ $url }}" fallback>Confirm email address</Action>

        <template #aside>
            <Advice title="Didn't ask for this?">
                You can ignore this email. Nothing changes unless the link is
                used.
            </Advice>
        </template>
    </Shell>
</template>
