<script setup lang="ts">
/**
 * The frame every email shares: the wordmark, a white card for the message
 * and a footer saying why it was sent.
 */
defineProps<{ preheader?: string }>();
</script>

<template>
    <Layout class="bg-slate-100 dark:bg-slate-950">
        <Preheader v-if="preheader">{{ preheader }}</Preheader>

        <Container class="max-w-xl p-0 py-10 sm:p-6">
            <Section class="px-8 pb-6">
                <Text
                    class="m-0 text-lg font-semibold tracking-tight text-slate-900 dark:text-white"
                >
                    <Raw>{{ config('app.name') }}</Raw>
                </Text>
            </Section>

            <Section class="rounded-xl bg-white px-8 py-10 dark:bg-slate-900">
                <slot />
            </Section>

            <Section class="px-8 py-8">
                <Text class="m-0 text-xs/5 text-slate-500 dark:text-slate-400">
                    <slot name="footer">
                        You're getting this email because it's about the
                        security of your account.
                    </slot>
                </Text>
            </Section>
        </Container>
    </Layout>
</template>
