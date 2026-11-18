/**
 * A fine rule with a short label in the middle ("or").
 */
export default function TextDivider({ children }: { children: string }) {
    return (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {children}
            <span className="h-px flex-1 bg-border" />
        </div>
    );
}
