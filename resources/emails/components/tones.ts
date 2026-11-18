/**
 * The four tones an email can have, and the classes each uses. Alerts are
 * critical or warning, confirmations success, and the rest info. Written
 * out in full so Tailwind finds every class.
 */
export type Tone = 'critical' | 'warning' | 'success' | 'info';

export const tones: Record<
    Tone,
    { bar: string; badge: string; eyebrow: string; box: string; title: string }
> = {
    critical: {
        bar: 'bg-red-500',
        badge: 'bg-red-50 dark:bg-red-500/15',
        eyebrow: 'text-red-600 dark:text-red-400',
        box: 'bg-red-50 border-red-100 dark:bg-red-500/10 dark:border-red-500/20',
        title: 'text-red-800 dark:text-red-300',
    },
    warning: {
        bar: 'bg-amber-400',
        badge: 'bg-amber-50 dark:bg-amber-500/15',
        eyebrow: 'text-amber-700 dark:text-amber-400',
        box: 'bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20',
        title: 'text-amber-900 dark:text-amber-300',
    },
    success: {
        bar: 'bg-emerald-500',
        badge: 'bg-emerald-50 dark:bg-emerald-500/15',
        eyebrow: 'text-emerald-700 dark:text-emerald-400',
        box: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20',
        title: 'text-emerald-900 dark:text-emerald-300',
    },
    info: {
        bar: 'bg-indigo-500',
        badge: 'bg-indigo-50 dark:bg-indigo-500/15',
        eyebrow: 'text-indigo-600 dark:text-indigo-400',
        box: 'bg-zinc-50 border-zinc-200 dark:bg-zinc-800/60 dark:border-zinc-700',
        title: 'text-zinc-900 dark:text-zinc-100',
    },
};
