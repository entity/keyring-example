import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * A numeric one-time code, drawn as one box per digit in two groups with a
 * dash between them (123–456, 1234–5678).
 *
 * Under the boxes is one ordinary input, so a <Label htmlFor={id}> names it,
 * the browser can autofill it (autocomplete="one-time-code") and forms and
 * tests fill it like any other field. Typing moves along by itself,
 * backspace steps back, and whatever arrives (typed, pasted or autofilled,
 * "123 456" or "123-456") is cut down to its digits.
 */
export default function CodeInput({
    id,
    length,
    value,
    onChange,
    invalid = false,
    autoFocus = false,
    disabled = false,
    className,
    ...aria
}: {
    id: string;
    length: number;
    value: string;
    onChange: (value: string) => void;
    invalid?: boolean;
    autoFocus?: boolean;
    disabled?: boolean;
    className?: string;
    'aria-describedby'?: string;
}) {
    const [focused, setFocused] = useState(false);
    const firstGroup = Math.ceil(length / 2);
    // The box the next digit goes in, or the last one once they're all in.
    const current = Math.min(value.length, length - 1);

    const box = (index: number) => {
        const active = focused && index === current;

        return (
            <div
                key={index}
                data-active={active || undefined}
                className={cn(
                    'relative flex aspect-[5/6] max-w-12 min-w-0 flex-1 items-center justify-center rounded-lg bg-field text-xl font-medium tabular-nums shadow-field transition-[box-shadow] duration-150 sm:text-2xl',
                    invalid && 'ring-1 ring-destructive',
                    'data-[active]:ring-2 data-[active]:ring-ring',
                )}
            >
                {value[index]}
                {active && value.length < length && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <span className="h-6 w-0.5 animate-caret-blink rounded-full bg-ring motion-reduce:animate-none" />
                    </span>
                )}
            </div>
        );
    };

    return (
        <div
            className={cn(
                'relative w-full',
                disabled && 'opacity-50',
                className,
            )}
        >
            <div
                aria-hidden="true"
                className="flex w-full items-center justify-center gap-2"
            >
                <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2">
                    {Array.from({ length: firstGroup }, (_, index) =>
                        box(index),
                    )}
                </div>
                <span className="h-0.5 w-2.5 shrink-0 rounded-full bg-input sm:w-3" />
                <div className="flex min-w-0 flex-1 items-center justify-start gap-1.5 sm:gap-2">
                    {Array.from({ length: length - firstGroup }, (_, index) =>
                        box(firstGroup + index),
                    )}
                </div>
            </div>

            <input
                id={id}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoCapitalize="none"
                spellCheck={false}
                required
                autoFocus={autoFocus}
                disabled={disabled}
                aria-invalid={invalid || undefined}
                {...aria}
                value={value}
                onChange={(event) =>
                    onChange(
                        event.target.value.replace(/\D/g, '').slice(0, length),
                    )
                }
                // Digits only ever go on the end, so keep the caret there.
                onSelect={(event) => {
                    const input = event.currentTarget;
                    const end = input.value.length;

                    if (
                        input.selectionStart !== end ||
                        input.selectionEnd !== end
                    ) {
                        input.setSelectionRange(end, end);
                    }
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                // Over the boxes, but unseen: its text, caret and selection
                // are transparent. 16px keeps iOS from zooming in.
                className="absolute inset-0 size-full cursor-text bg-transparent text-base text-transparent caret-transparent outline-none selection:bg-transparent disabled:cursor-not-allowed"
            />
        </div>
    );
}
