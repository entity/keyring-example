<script setup lang="ts">
/**
 * A short list under the message, like what we noticed: a small title over
 * quiet lines, in a soft panel like the details.
 */
defineProps<{ title?: string }>();
</script>

<template>
    <NotPlaintext><Spacer class="h-7" /></NotPlaintext>
    <div
        class="rounded-xl border border-solid border-[#efecea] bg-[#faf9f8] px-5 py-4 text-left sm:px-4 dark:border-[#2a2c31] dark:bg-[#1a1b1f]"
    >
        <Text
            v-if="title || $slots.title"
            class="m-0 text-[13px]/5 font-semibold text-[#111010] dark:text-[#f1f2f4]"
        >
            <slot name="title">{{ title }}</slot>
        </Text>
        <div class="text-[13px]/5 text-[#535150] dark:text-[#afb1b5]">
            <slot />
        </div>
    </div>
</template>
