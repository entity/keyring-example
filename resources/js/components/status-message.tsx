import { CircleCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A flashed status ("We've emailed you a link", "Saved"), as a soft green
 * note. It's announced to screen readers when it appears.
 */
export default function StatusMessage({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            role="status"
            className={cn(
                'flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 inset-ring inset-ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-200 dark:inset-ring-emerald-400/20',
                className,
            )}
        >
            <CircleCheck
                className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-300"
                aria-hidden="true"
            />
            <p>{children}</p>
        </div>
    );
}
