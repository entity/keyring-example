<script setup lang="ts">
/**
 * What to do if it wasn't you: a short title and plain, quiet text. The
 * Shell puts it in the grey strip along the bottom of the card.
 */
defineProps<{ title?: string }>();
</script>

<template>
    <Text
        v-if="title || $slots.title"
        class="m-0 text-[13px]/5 font-semibold text-[#111010] dark:text-[#f1f2f4]"
    >
        <slot name="title">{{ title }}</slot>
    </Text>
    <Text class="m-0 mt-1 text-[13px]/5 text-[#726f6f] dark:text-[#9c9ea4]">
        <slot />
    </Text>
</template>
