<!--
  The facts of an event, from $details: a list of ['label' => ..., 'value'
  => ...]. A soft grey panel inside the card, with quiet labels and their
  values in the HTML, and "Label: value" lines in plain text.
-->
<template>
    <Raw>@if ($details !== [])</Raw>
    <NotPlaintext>
        <Spacer class="h-7 sm:h-6" />
        <table
            role="none"
            cellpadding="0"
            cellspacing="0"
            class="w-full rounded-xl border border-solid border-[#efecea] bg-[#faf9f8] dark:border-[#2a2c31] dark:bg-[#1a1b1f]"
        >
            <tr>
                <td class="px-5 py-3 sm:px-4">
                    <table
                        role="none"
                        cellpadding="0"
                        cellspacing="0"
                        class="w-full"
                    >
                        <Raw>@foreach ($details as $detail)</Raw>
                        <tr>
                            <td
                                class="w-[110px] py-1.5 pr-4 text-left align-top text-[13px]/5 text-[#726f6f] sm:w-[72px] sm:pr-3 dark:text-[#9c9ea4]"
                            >
                                <Raw>{{ $detail['label'] }}</Raw>
                            </td>
                            <td
                                class="py-1.5 text-right align-top text-[13px]/5 font-medium text-[#111010] dark:text-[#f1f2f4]"
                            >
                                <Raw>{{ $detail['value'] }}</Raw>
                            </td>
                        </tr>
                        <Raw>@endforeach</Raw>
                    </table>
                </td>
            </tr>
        </table>
    </NotPlaintext>
    <Plaintext>
        <Raw>@foreach ($details as $detail)</Raw>
        <Raw>{{ $detail['label'] }}</Raw
        >: <Raw>{{ $detail['value'] }}</Raw>
        <Raw>@endforeach</Raw>
    </Plaintext>
    <Raw>@endif</Raw>
</template>
