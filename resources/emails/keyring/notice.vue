<!--
  Every security notice: "your password was changed", "new sign-in" and the
  rest. KeyringServiceProvider::noticeMail() passes the subject, intro,
  detail lines and, for some, a button.
-->
<template>
    <Shell>
        <Heading
            class="m-0 text-2xl/8 font-semibold text-slate-900 dark:text-white"
        >
            <Raw>{{ $subject }}</Raw>
        </Heading>

        <Text class="m-0 mt-4 text-base/7 text-slate-600 dark:text-slate-300">
            <Raw>{{ $intro }}</Raw>
        </Text>

        <Raw>@if ($details !== [])</Raw>
        <Spacer class="h-6" />
        <table class="w-full rounded-lg bg-slate-50 dark:bg-slate-800">
            <Raw>@foreach ($details as $detail)</Raw>
            <tr>
                <td
                    class="w-28 px-4 py-2 align-top text-sm text-slate-500 dark:text-slate-400"
                >
                    <Raw>{{ $detail['label'] }}</Raw>
                </td>
                <td
                    class="px-4 py-2 text-sm font-medium text-slate-900 dark:text-white"
                >
                    <Raw>{{ $detail['value'] }}</Raw>
                </td>
            </tr>
            <Raw>@endforeach</Raw>
        </table>
        <Raw>@endif</Raw>

        <Raw>@isset($actionUrl)</Raw>
        <Spacer class="h-8" />
        <Button
            href="{{ $actionUrl }}"
            class="rounded-lg bg-slate-900 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
        >
            <Raw>{{ $actionText }}</Raw>
        </Button>
        <Raw>@endisset</Raw>

        <Spacer class="h-8" />
        <Text class="m-0 text-sm/6 text-slate-500 dark:text-slate-400">
            If this wasn't you, change your password and check your sign-in
            methods straight away.
        </Text>
        <Contact />
    </Shell>
</template>
