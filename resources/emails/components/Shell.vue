<script setup lang="ts">
/**
 * The frame every email shares: the logo, a card for the message, and a
 * footer saying why it was sent and who to ask for help. The #top slot sits
 * on the card's top edge, for the tone's accent bar.
 *
 * Its links and images start at Keyring's link root (APP_URL), never at the
 * request: asset() follows the Host header, so a forged one on "forgot
 * password" would put someone else's site in a real email.
 */
defineProps<{ preheader?: string }>();
</script>

<template>
    <Layout
        class="bg-zinc-100 dark:bg-zinc-950"
        body-class="bg-zinc-100 dark:bg-zinc-950"
    >
        <Raw>@php($root = \Keyring\Facades\Keyring::linkRoot())</Raw>
        <Raw>@php($images = $root.'/images/emails')</Raw>
        <Preheader v-if="preheader">{{ preheader }}</Preheader>
        <slot name="preheader" />

        <Container class="max-w-xl p-0 py-10 sm:px-4 sm:py-6">
            <NotPlaintext>
                <Section class="px-8 pb-6 sm:px-4">
                    <table role="none" cellpadding="0" cellspacing="0">
                        <tr>
                            <td class="pr-3 align-middle">
                                <a href="{{ $root }}">
                                    <img
                                        src="{{ $images }}/logo.png"
                                        width="36"
                                        height="36"
                                        alt=""
                                        class="block rounded-[9px]"
                                    />
                                </a>
                            </td>
                            <td class="align-middle">
                                <Text
                                    class="m-0 text-base/6 font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
                                >
                                    <Raw>{{ config('app.name') }}</Raw>
                                </Text>
                            </td>
                        </tr>
                    </table>
                </Section>
            </NotPlaintext>
            <Plaintext
                ><Raw>{{ config('app.name') }}</Raw></Plaintext
            >

            <Section
                class="rounded-2xl border border-solid border-zinc-200 bg-white p-0 dark:border-zinc-800 dark:bg-zinc-900"
            >
                <NotPlaintext><slot name="top" /></NotPlaintext>
                <Section class="px-10 py-10 sm:px-6 sm:py-8">
                    <slot />
                </Section>
            </Section>

            <Section class="px-8 pt-8 sm:px-4">
                <Raw>@isset($contact)</Raw>
                <Text
                    class="m-0 mb-3 text-[13px]/5 text-zinc-600 dark:text-zinc-300"
                >
                    If this wasn't you and you need help, contact us:
                    <Raw>@isset($contactUrl)</Raw>
                    <Link
                        href="{{ $contactUrl }}"
                        class="font-semibold text-zinc-950 underline dark:text-zinc-50"
                        ><Raw>{{ $contact }}</Raw></Link
                    >
                    <Raw>@else</Raw>
                    <Raw>{{ $contact }}</Raw>
                    <Raw>@endisset</Raw>
                </Text>
                <Raw>@endisset</Raw>
                <Text class="m-0 text-xs/5 text-zinc-500 dark:text-zinc-400">
                    <slot name="footer">
                        You're getting this email because it's about the
                        security of your account.
                    </slot>
                </Text>
                <Text
                    class="m-0 mt-3 text-xs/5 text-zinc-500 dark:text-zinc-400"
                >
                    <Link
                        href="{{ $root }}"
                        class="text-zinc-500 no-underline dark:text-zinc-400"
                        ><Raw>{{ config('app.name') }}</Raw></Link
                    >
                </Text>
            </Section>
        </Container>
    </Layout>
</template>
