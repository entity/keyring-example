<script setup lang="ts">
/** A tinted box with a short title, for advice or what we noticed. */
import { tones, type Tone } from './tones';

withDefaults(defineProps<{ tone?: Tone; title?: string }>(), { tone: 'info' });
</script>

<template>
    <Spacer class="h-6" />
    <div :class="['rounded-xl border border-solid px-5 py-4', tones[tone].box]">
        <Text
            v-if="title || $slots.title"
            :class="['m-0 text-sm/6 font-semibold', tones[tone].title]"
        >
            <slot name="title">{{ title }}</slot>
        </Text>
        <div class="text-sm/6 text-zinc-600 dark:text-zinc-300">
            <slot />
        </div>
    </div>
</template>
