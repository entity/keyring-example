<script setup lang="ts">
/**
 * A button to $href, which is Blade like "{{ $url }}". Old Outlook gets
 * Maizzle's padded fallback. With `fallback`, the link follows in full for
 * mail apps that won't open the button. Plain text has the label and link.
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
            class="rounded-lg bg-zinc-900 px-6 py-3.5 text-sm/5 font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950"
            ms-pt="14px"
            ms-pb="27px"
        >
            <slot />
        </Button>
        <Button
            v-else
            :href="href"
            variant="outline"
            class="rounded-lg border-zinc-300 bg-white px-6 py-3.5 text-sm/5 font-semibold text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            ms-pt="14px"
            ms-pb="27px"
        >
            <slot />
        </Button>
        <template v-if="fallback">
            <Text
                class="m-0 mt-5 text-[13px]/5 text-zinc-500 dark:text-zinc-400"
            >
                Button not working? Paste this link into your browser:
            </Text>
            <Text class="m-0 mt-1 text-[13px]/5 break-all">
                <Link
                    :href="href"
                    class="text-indigo-600 underline dark:text-indigo-400"
                    >{{ href }}</Link
                >
            </Text>
        </template>
    </NotPlaintext>
    <Plaintext>
        <slot />:<br />{{ href }}
    </Plaintext>
</template>
