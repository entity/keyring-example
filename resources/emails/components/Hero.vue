<script setup lang="ts">
/**
 * The top of the message: an icon in a tinted circle, a short label in the
 * tone's colour, and the heading (the slot). `icon` is the image's name in
 * public/images/emails, without "-tone.png"; it may be Blade, like
 * "{{ $icon }}". The icon is only decoration, so it has no alt text.
 */
import { tones, type Tone } from './tones';

defineProps<{ tone: Tone; icon: string; eyebrow?: string }>();
</script>

<template>
    <table role="none" cellpadding="0" cellspacing="0">
        <tr>
            <td
                :class="[
                    'h-11 w-11 rounded-full text-center align-middle',
                    tones[tone].badge,
                ]"
            >
                <img
                    :src="`{{ $images }}/${icon}-${tone}.png`"
                    width="24"
                    height="24"
                    alt=""
                    class="mx-auto block"
                />
            </td>
            <td class="pl-3 align-middle">
                <Text
                    :class="[
                        'm-0 text-xs/4 font-semibold tracking-wider uppercase',
                        tones[tone].eyebrow,
                    ]"
                >
                    <slot name="eyebrow">{{ eyebrow }}</slot>
                </Text>
            </td>
        </tr>
    </table>
    <Spacer class="h-5" />
    <Heading
        class="m-0 text-2xl/8 font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
    >
        <slot />
    </Heading>
</template>
