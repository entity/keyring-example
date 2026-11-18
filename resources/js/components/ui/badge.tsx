import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

/*
 * Soft pills: a tint of the colour, its text in a deeper shade and a fine
 * ring of its own colour. Colour only carries meaning: green for on or
 * good, amber for a warning, red for danger, blue for the current thing.
 */
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none inset-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-accent-0 text-accent-700 inset-ring-accent-600/15 dark:bg-accent-500/15 dark:text-accent-100 dark:inset-ring-accent-300/25",
        secondary:
          "bg-gray-100 text-gray-700 inset-ring-gray-600/10 dark:bg-white/6 dark:text-gray-300 dark:inset-ring-white/10",
        outline:
          "bg-raised text-foreground inset-ring-gray-600/15 dark:inset-ring-white/12",
        success:
          "bg-emerald-50 text-emerald-700 inset-ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:inset-ring-emerald-400/20",
        warning:
          "bg-amber-50 text-amber-800 inset-ring-amber-600/25 dark:bg-amber-400/10 dark:text-amber-300 dark:inset-ring-amber-400/20",
        destructive:
          "bg-red-50 text-red-700 inset-ring-red-600/15 dark:bg-red-400/10 dark:text-red-300 dark:inset-ring-red-400/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
