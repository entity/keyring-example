<!--
  Sent to an address that already has an account when someone tries to move
  another account to it, instead of telling them it's taken.
-->
<template>
    <Shell preheader="Someone tried to use your email address.">
        <Heading
            class="m-0 text-2xl/8 font-semibold text-slate-900 dark:text-white"
        >
            Someone tried to use your email address
        </Heading>

        <Text class="m-0 mt-4 text-base/7 text-slate-600 dark:text-slate-300">
            Someone tried to change another account's email address to this one.
            This address already has an account, so nothing was changed.
        </Text>

        <Text class="m-0 mt-4 text-sm/6 text-slate-500 dark:text-slate-400">
            If this was you, sign in to your existing account instead.
            Otherwise, you can ignore this email.
        </Text>
    </Shell>
</template>
