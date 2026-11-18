<script setup lang="ts">
/**
 * A full-width button to $href, which is Blade like "{{ $url }}": a
 * near-black one lit from the top, or a quiet white one as `secondary`.
 * Old Outlook gets Maizzle's padded fallback. With `fallback`, a small line
 * follows with the link in full, for mail apps that won't open the button.
 * Plain text has the label and link.
 */
withDefaults(
    defineProps<{
        href: string;
        variant?: 'primary' | 'secondary';
        fallback?: boolean;
    }>(),
    { variant: 'primary', fallback: false },
);
</script>

<template>
    <NotPlaintext>
        <Button
            v-if="variant === 'primary'"
            :href="href"
            align="center"
            class="block rounded-[10px] bg-[#1b1a1a] bg-[image:linear-gradient(180deg,#2e2d2c_0%,#161515_100%)] px-6 py-3.5 text-[15px]/5 font-semibold text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16),0_0_0_1px_#111010,0_1px_2px_0_rgba(17,16,16,0.24)] dark:bg-[#f1f2f4] dark:bg-none dark:text-[#17181c] dark:shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.12),0_1px_2px_0_rgba(0,0,0,0.5)]"
            ms-pt="14px"
            ms-pb="27px"
        >
            <slot />
        </Button>
        <Button
            v-else
            :href="href"
            align="center"
            variant="outline"
            class="block rounded-[10px] border-[#dfdad8] bg-white px-5 py-3 text-sm/5 font-semibold text-[#111010] shadow-[0_1px_2px_0_rgba(17,16,16,0.06)] dark:border-[#3b3c40] dark:bg-[#28292e] dark:text-[#f1f2f4] dark:shadow-[0_1px_2px_0_rgba(0,0,0,0.5)]"
            ms-pt="12px"
            ms-pb="24px"
        >
            <slot />
        </Button>
        <template v-if="fallback">
            <Text class="m-0 mt-5 text-xs/5 text-[#878382] dark:text-[#8b8d93]">
                Button not working? Paste this link into your browser:<br />
                <Link
                    :href="href"
                    class="break-all text-[#726f6f] underline dark:text-[#9c9ea4]"
                    >{{ href }}</Link
                >
            </Text>
        </template>
    </NotPlaintext>
    <Plaintext> <slot />:<br />{{ href }} </Plaintext>
</template>
