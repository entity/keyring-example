<script setup lang="ts">
/** The coloured bar along the top of the card, in the email's tone. */
import { tones, type Tone } from './tones';

defineProps<{ tone: Tone }>();
</script>

<template>
    <div :class="['h-1 rounded-t-2xl leading-1', tones[tone].bar]">&zwj;</div>
</template>
