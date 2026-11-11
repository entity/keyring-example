<!--
  "If this wasn't you and you need help, contact us", for the emails that say
  it. $contact is "support_contact" in config/keyring.php, and $contactUrl a
  link to it when it's an address or a page. Nothing shows while it's unset.
-->
<template>
    <Raw>@isset($contact)</Raw>
    <Text class="m-0 mt-4 text-sm/6 text-slate-500 dark:text-slate-400">
        If this wasn't you and you need help, contact us:
        <Raw>@isset($contactUrl)</Raw>
        <Link
            href="{{ $contactUrl }}"
            class="font-medium text-slate-900 underline dark:text-white"
            ><Raw>{{ $contact }}</Raw></Link
        >
        <Raw>@else</Raw>
        <Raw>{{ $contact }}</Raw>
        <Raw>@endisset</Raw>
    </Text>
    <Raw>@endisset</Raw>
</template>
