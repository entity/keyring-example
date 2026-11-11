<!--
  The code for signing in with an email code, or for adding one as a sign-in
  method ($enrolling).
-->
<template>
    <Shell preheader="Your verification code.">
        <Heading
            class="m-0 text-2xl/8 font-semibold text-slate-900 dark:text-white"
        >
            Your verification code
        </Heading>

        <Text class="m-0 mt-4 text-base/7 text-slate-600 dark:text-slate-300">
            Enter this code to finish. It expires in
            <Raw>{{ $minutes }}</Raw> minutes.
        </Text>

        <Spacer class="h-6" />
        <Text
            class="m-0 rounded-lg bg-slate-50 px-6 py-5 text-center font-mono text-3xl font-semibold tracking-[0.3em] text-slate-900 dark:bg-slate-800 dark:text-white"
        >
            <Raw>{{ $code }}</Raw>
        </Text>

        <Spacer class="h-8" />
        <Text class="m-0 text-sm/6 text-slate-500 dark:text-slate-400">
            <Raw>@if ($enrolling)</Raw>
            If you didn't ask to add this email as a sign-in method, someone may
            be signed in to your account. Please change your password.
            <Raw>@else</Raw>
            If you didn't try to sign in, someone may know your password. Please
            change it.
            <Raw>@endif</Raw>
        </Text>
        <Contact />
    </Shell>
</template>
