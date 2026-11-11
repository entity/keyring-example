<!--
  Sent to the current address during an email change, with a link to cancel
  it. The change is confirmed from here too ($confirmUrl), unless whoever
  asked proved a second factor the account has had for a while.
-->
<template>
    <Shell
        preheader="Someone asked to change the email address on your account."
    >
        <Heading
            class="m-0 text-2xl/8 font-semibold text-slate-900 dark:text-white"
        >
            Your email address is being changed
        </Heading>

        <Text class="m-0 mt-4 text-base/7 text-slate-600 dark:text-slate-300">
            Someone asked to change the email address on your account to
            <Text as="span" class="font-semibold text-slate-900 dark:text-white"
                ><Raw>{{ $email }}</Raw></Text
            >.
        </Text>

        <Raw>@isset($confirmUrl)</Raw>
        <Text class="m-0 mt-4 text-base/7 text-slate-600 dark:text-slate-300">
            To finish the change, confirm it from this address too.
        </Text>
        <Spacer class="h-6" />
        <Button
            href="{{ $confirmUrl }}"
            class="rounded-lg bg-slate-900 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
        >
            Confirm the change
        </Button>
        <Raw>@endisset</Raw>

        <Spacer class="h-8" />
        <Hr class="border-slate-200 dark:border-slate-700" />
        <Spacer class="h-6" />

        <Text class="m-0 text-sm/6 text-slate-600 dark:text-slate-300">
            Wasn't you? Cancel the change and sign out everywhere:
        </Text>
        <Spacer class="h-4" />
        <Button
            href="{{ $revertUrl }}"
            variant="outline"
            class="rounded-lg border-slate-300 text-sm font-semibold text-slate-900 dark:border-slate-600 dark:text-white"
        >
            This wasn't me
        </Button>
        <Contact />
    </Shell>
</template>
