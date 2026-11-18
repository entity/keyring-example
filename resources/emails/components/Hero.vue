<script setup lang="ts">
/**
 * The top of the card: a round badge in the email's tone, and the heading
 * (the slot) under it. The badge is an image in public/images/emails named
 * "icon-tone.png"; `icon` and `tone` may be Blade, like "{{ $icon }}". It's
 * only decoration, so it has no alt text.
 */
defineProps<{ tone: string; icon: string }>();
</script>

<template>
    <img
        :src="`{{ $images }}/${icon}-${tone}.png`"
        width="60"
        height="60"
        alt=""
        class="mx-auto -mt-1.5 block"
    />
    <Spacer class="h-3.5" />
    <Heading
        class="m-0 text-2xl/[30px] font-semibold tracking-[-0.022em] text-[#111010] sm:text-[21px]/[28px] dark:text-[#f1f2f4]"
    >
        <slot />
    </Heading>
</template>
