<!--
  The facts of an event, from $details: a list of ['label' => ..., 'value'
  => ...]. A table in the HTML and "Label: value" lines in plain text.
-->
<template>
    <Raw>@if ($details !== [])</Raw>
    <NotPlaintext>
        <Spacer class="h-6" />
        <table
            role="none"
            cellpadding="0"
            cellspacing="0"
            class="w-full rounded-xl border border-solid border-zinc-200 dark:border-zinc-800"
        >
            <Raw>@foreach ($details as $detail)</Raw>
            <Raw>@unless ($loop->first)</Raw>
            <tr>
                <td
                    colspan="2"
                    class="h-px bg-zinc-200 text-[0px] leading-[0px] dark:bg-zinc-800"
                >
                    &zwj;
                </td>
            </tr>
            <Raw>@endunless</Raw>
            <tr>
                <td
                    class="w-[120px] px-4 py-3 align-top text-[13px]/5 text-zinc-500 sm:w-[96px] dark:text-zinc-400"
                >
                    <Raw>{{ $detail['label'] }}</Raw>
                </td>
                <td
                    class="px-4 py-3 align-top text-[13px]/5 font-medium text-zinc-950 dark:text-zinc-50"
                >
                    <Raw>{{ $detail['value'] }}</Raw>
                </td>
            </tr>
            <Raw>@endforeach</Raw>
        </table>
    </NotPlaintext>
    <Plaintext>
        <Raw>@foreach ($details as $detail)</Raw>
        <Raw>{{ $detail['label'] }}</Raw>: <Raw>{{ $detail['value'] }}</Raw>
        <Raw>@endforeach</Raw>
    </Plaintext>
    <Raw>@endif</Raw>
</template>
