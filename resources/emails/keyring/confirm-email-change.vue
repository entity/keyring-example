<!-- Sent to the new address during an email change: confirm it's yours. -->
<template>
    <Shell preheader="Confirm this is your new email address.">
        <template #footer>
            You're getting this email because someone asked to use this address
            for their account.
        </template>

        <Heading
            class="m-0 text-2xl/8 font-semibold text-slate-900 dark:text-white"
        >
            Confirm your new email address
        </Heading>

        <Text class="m-0 mt-4 text-base/7 text-slate-600 dark:text-slate-300">
            Please confirm this is the new email address for your account.
        </Text>

        <Spacer class="h-8" />
        <Button
            href="{{ $url }}"
            class="rounded-lg bg-slate-900 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
        >
            Confirm email address
        </Button>

        <Spacer class="h-8" />
        <Text class="m-0 text-sm/6 text-slate-500 dark:text-slate-400">
            This link expires <Raw>{{ $expires }}</Raw
            >. If you didn't ask for this, you can ignore this email.
        </Text>
    </Shell>
</template>
