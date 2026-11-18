<script setup lang="ts">
/**
 * The frame every email shares, after the sign-in challenge: on a soft
 * blue backdrop, the logo and app name, then a raised white card with the
 * message (the slot) and, in a grey strip along its bottom, what to do if
 * it wasn't you (#aside). A quiet footer under the card says who to ask
 * for help and why it was sent.
 *
 * The backdrop is a solid colour with a gradient over it: mail apps that
 * drop background images (Gmail) show the colour alone.
 *
 * Its links and images start at Keyring's link root (APP_URL), never at the
 * request: asset() follows the Host header, so a forged one on "forgot
 * password" would put someone else's site in a real email.
 */
defineProps<{ preheader?: string }>();
</script>

<template>
    <Layout
        class="bg-[#f2f4fa] bg-[image:radial-gradient(140%_110%_at_50%_100%,#f2f4fa_52%,#bccbf2_100%)] text-[#111010] dark:bg-[#17181c] dark:bg-[image:radial-gradient(140%_110%_at_50%_100%,#17181c_52%,#27356e_100%)] dark:text-[#f1f2f4]"
        body-class="bg-[#f2f4fa] dark:bg-[#17181c]"
    >
        <Raw>@php($root = \Keyring\Facades\Keyring::linkRoot())</Raw>
        <Raw>@php($images = $root.'/images/emails')</Raw>
        <Preheader v-if="preheader">{{ preheader }}</Preheader>
        <slot name="preheader" />

        <Container
            class="mx-auto max-w-[560px] px-5 pt-12 pb-14 sm:px-3 sm:pt-8 sm:pb-10"
        >
            <NotPlaintext>
                <table
                    role="none"
                    cellpadding="0"
                    cellspacing="0"
                    align="center"
                    class="mx-auto"
                >
                    <tr>
                        <td class="pr-2.5 align-middle">
                            <a href="{{ $root }}" class="block">
                                <img
                                    src="{{ $images }}/logo.png"
                                    width="32"
                                    height="32"
                                    alt=""
                                    class="block rounded-[9px]"
                                />
                            </a>
                        </td>
                        <td class="align-middle">
                            <a
                                href="{{ $root }}"
                                class="text-[15px]/5 font-semibold tracking-[-0.01em] text-[#111010] no-underline dark:text-[#f1f2f4]"
                                ><Raw>{{ config('app.name') }}</Raw></a
                            >
                        </td>
                    </tr>
                </table>
                <Spacer class="h-6" />
            </NotPlaintext>
            <Plaintext
                ><Raw>{{ config('app.name') }}</Raw></Plaintext
            >

            <div
                class="rounded-2xl border border-solid border-[#dde1e7] bg-white text-center shadow-[0_0_0_6px_rgba(255,255,255,0.4),0_10px_13px_0_rgba(0,0,0,0.05),0_17px_17px_0_rgba(0,0,0,0.04),0_28px_20px_0_rgba(0,0,0,0.03)] dark:border-[#3b3c40] dark:bg-[#1f2024] dark:shadow-[0_0_0_6px_rgba(255,255,255,0.03),0_24px_48px_-12px_rgba(0,0,0,0.7)]"
            >
                <div class="px-10 pt-10 pb-10 sm:px-6 sm:pt-8 sm:pb-8">
                    <slot />
                </div>

                <div
                    v-if="$slots.aside"
                    class="rounded-b-[15px] border-0 border-t border-solid border-[#ece8e6] bg-[#faf9f8] px-10 py-6 sm:px-6 sm:py-5 dark:border-[#313338] dark:bg-[#1a1b1f]"
                >
                    <slot name="aside" />
                </div>
            </div>

            <NotPlaintext><Spacer class="h-8 sm:h-6" /></NotPlaintext>

            <div class="px-6 text-center sm:px-3">
                <Raw>@isset($contact)</Raw>
                <Text
                    class="m-0 mb-1.5 text-xs/5 text-[#5f5c5b] dark:text-[#afb1b5]"
                >
                    If this wasn't you and you need help, contact us:
                    <Raw>@isset($contactUrl)</Raw>
                    <Link
                        href="{{ $contactUrl }}"
                        class="font-medium text-[#111010] underline dark:text-[#f1f2f4]"
                        ><Raw>{{ $contact }}</Raw></Link
                    >
                    <Raw>@else</Raw>
                    <Raw>{{ $contact }}</Raw>
                    <Raw>@endisset</Raw>
                </Text>
                <Raw>@endisset</Raw>
                <Text class="m-0 text-xs/5 text-[#726f6f] dark:text-[#9c9ea4]">
                    <slot name="footer">
                        You're getting this email because it's about the
                        security of your account.
                    </slot>
                </Text>
                <Plaintext>
                    <Link href="{{ $root }}"
                        ><Raw>{{ config('app.name') }}</Raw></Link
                    >
                </Plaintext>
            </div>
        </Container>
    </Layout>
</template>
