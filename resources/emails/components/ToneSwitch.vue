<script setup lang="ts">
/**
 * For the emails whose tone is only known when they're sent ($tone): the
 * slot once per tone, with Blade picking the one that matches.
 */
import { tones } from './tones';

const names = Object.keys(tones);
</script>

<template>
    <template v-for="(name, index) in names" :key="name">
        <Blade
            :code="`@${index === 0 ? 'if' : 'elseif'} ($tone === '${name}')`"
        />
        <slot :tone="name" />
    </template>
    <Blade code="@endif" />
</template>
