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

        <Heading
            class="m-0 text-2xl/8 font-semibold text-slate-900 dark:text-white"
        >
            You already have an account
        </Heading>

        <Text class="m-0 mt-4 text-base/7 text-slate-600 dark:text-slate-300">
            Someone tried to create an account with this email address. It
            already has one, so nothing was created or changed.
        </Text>

        <Spacer class="h-8" />
        <Button
            href="{{ $loginUrl }}"
            class="rounded-lg bg-slate-900 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
        >
            Sign in
        </Button>

        <Raw>@isset($resetUrl)</Raw>
        <Spacer class="h-8" />
        <Hr class="border-slate-200 dark:border-slate-700" />
        <Spacer class="h-6" />

        <Text class="m-0 text-sm/6 text-slate-600 dark:text-slate-300">
            Forgotten your password?
        </Text>
        <Spacer class="h-4" />
        <Button
            href="{{ $resetUrl }}"
            variant="outline"
            class="rounded-lg border-slate-300 text-sm font-semibold text-slate-900 dark:border-slate-600 dark:text-white"
        >
            Reset your password
        </Button>
        <Raw>@endisset</Raw>

        <Spacer class="h-8" />
        <Text class="m-0 text-sm/6 text-slate-500 dark:text-slate-400">
            If this wasn't you, you can ignore this email.
        </Text>
    </Shell>
</template>
