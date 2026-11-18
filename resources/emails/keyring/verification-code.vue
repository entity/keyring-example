<!--
  The code for signing in with an email code, or for adding one as a sign-in
  method ($enrolling).
-->
<template>
    <Shell>
        <template #preheader>
            <Preheader>
                Enter it to finish. It expires in <Raw>{{ $minutes }}</Raw>
                minutes.
            </Preheader>
        </template>
        <template #top><Accent tone="info" /></template>

        <NotPlaintext>
            <Hero tone="info" icon="shield-check" eyebrow="Verification code">
                Your verification code
            </Hero>
        </NotPlaintext>
        <Plaintext>Your verification code</Plaintext>

        <Raw>@if ($enrolling)</Raw>
        <Lead>
            Enter this code to finish adding your email address as a way to
            sign in. It expires in <Raw>{{ $minutes }}</Raw> minutes.
        </Lead>
        <Raw>@else</Raw>
        <Lead>
            Enter this code to finish signing in. It expires in
            <Raw>{{ $minutes }}</Raw> minutes.
        </Lead>
        <Raw>@endif</Raw>

        <Spacer class="h-6" />
        <NotPlaintext>
            <Text
                class="m-0 rounded-xl border border-solid border-zinc-200 bg-zinc-50 px-6 py-6 text-center font-mono text-4xl/10 font-semibold tracking-[0.25em] text-zinc-950 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            >
                <Raw>{{ $code }}</Raw>
            </Text>
        </NotPlaintext>
        <Plaintext>Your code: <Raw>{{ $code }}</Raw></Plaintext>

        <Note>Don't share this code with anyone. We'll never ask you for it.</Note>

        <Raw>@if ($enrolling)</Raw>
        <Callout title="Didn't ask for this?">
            <Text class="m-0 text-sm/6">
                Someone may be signed in to your account. Change your password
                and check your sign-in methods straight away.
            </Text>
        </Callout>
        <Raw>@else</Raw>
        <Callout title="Didn't try to sign in?">
            <Text class="m-0 text-sm/6">
                Someone may know your password. Change it straight away.
            </Text>
        </Callout>
        <Raw>@endif</Raw>
    </Shell>
</template>
