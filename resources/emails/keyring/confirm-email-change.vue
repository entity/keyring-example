<!-- Sent to the new address during an email change: confirm it's yours. -->
<template>
    <Shell preheader="Confirm this is your new email address.">
        <template #top><Accent tone="info" /></template>
        <template #footer>
            You're getting this email because someone asked to use this address
            for their account.
        </template>

        <NotPlaintext>
            <Hero tone="info" icon="mail-check" eyebrow="Confirm your email">
                Confirm your new email address
            </Hero>
        </NotPlaintext>
        <Plaintext>Confirm your new email address</Plaintext>

        <Lead>
            Someone asked to use this address for their account. If that was
            you, confirm it to finish the change.
        </Lead>

        <Spacer class="h-8" />
        <Action href="{{ $url }}" fallback>Confirm email address</Action>

        <Note
            >This link expires <Raw>{{ $expires }}.</Raw></Note
        >

        <Callout title="Didn't ask for this?">
            <Text class="m-0 text-sm/6">
                You can ignore this email. Nothing changes unless the link is
                used.
            </Text>
        </Callout>
    </Shell>
</template>
