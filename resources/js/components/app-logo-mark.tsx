import AppLogoIcon from '@/components/app-logo-icon';
import { cn } from '@/lib/utils';

/**
 * The key on a small dark tile with a fine highlight along its top edge,
 * the way the primary button is lit.
 */
export default function AppLogoMark({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-950 text-white shadow-[inset_0_1px_0_0_rgb(255_255_255/0.16),0_0_0_1px_var(--color-gray-950),0_1px_2px_0_rgb(0_0_0/0.2)] dark:bg-white dark:text-gray-950 dark:shadow-[inset_0_-1px_0_0_rgb(0_0_0/0.1),0_1px_2px_0_rgb(0_0_0/0.5)]',
                className,
            )}
        >
            <AppLogoIcon className="size-[62%] fill-current" />
        </span>
    );
}
