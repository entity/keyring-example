import type { LucideIcon } from 'lucide-react';

/** A list row's icon, on a small raised disc. */
export default function RowIcon({ icon: Icon }: { icon: LucideIcon }) {
    return (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tint text-muted-foreground shadow-raised">
            <Icon className="size-4" aria-hidden="true" />
        </span>
    );
}
