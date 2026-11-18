<!--
  Sent to an address that already has an account when someone tries to
  register with it, instead of telling them on the form that it's taken.
-->
<template>
    <Shell preheader="Someone tried to create an account with this address.">
        <template #footer>
            You're getting this email because someone tried to register with
            this address.
        </template>

        <NotPlaintext>
            <Hero tone="info" icon="user-round-check"
                >You already have an account</Hero
            >
        </NotPlaintext>
        <Plaintext>You already have an account</Plaintext>

        <Lead>
            Someone tried to create an account with this email address. It
            already has one, so nothing was created or changed.
        </Lead>

        <Spacer class="h-8" />
        <Action href="{{ $loginUrl }}">Sign in</Action>

        <Raw>@isset($resetUrl)</Raw>
        <NotPlaintext>
            <Note>
                Forgotten your password?
                <Link
                    href="{{ $resetUrl }}"
                    class="font-medium text-[#111010] underline dark:text-[#f1f2f4]"
                    >Reset your password</Link
                >
            </Note>
        </NotPlaintext>
        <Plaintext>
            <div>
                Forgotten your password? Reset your password:<br /><Raw>{{
                    $resetUrl
                }}</Raw>
            </div>
        </Plaintext>
        <Raw>@endisset</Raw>

        <template #aside>
            <Advice title="Wasn't you?">
                You can ignore this email. Your account hasn't changed.
            </Advice>
        </template>
    </Shell>
</template>
