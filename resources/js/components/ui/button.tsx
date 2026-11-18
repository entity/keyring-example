import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

/*
 * entity/ui's buttons. The primary is tactile: an accent fill with a fine
 * inset highlight along the top. Secondary actions are raised white
 * ("outline"), soft gray fills ("secondary") or bare ("ghost"). Every
 * button squeezes slightly when pressed, except with reduced motion.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium tracking-[-0.01em] select-none outline-none transition-[background-color,color,box-shadow,transform] duration-150 ease-out-quint active:scale-[0.97] data-[state=open]:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:outline-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-primary text-shadow-2xs text-shadow-black/15 hover:bg-primary-hover",
        destructive:
          "bg-destructive text-white shadow-danger text-shadow-2xs text-shadow-black/15 hover:bg-destructive-hover",
        outline:
          "bg-raised text-foreground shadow-raised hover:bg-accent dark:hover:bg-deep-gray-700",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
        ghost: "text-foreground hover:bg-accent",
        link: "text-primary underline-offset-4 hover:underline active:scale-100 dark:text-accent-200",
      },
      size: {
        default: "h-9 px-3.5 has-[>svg]:px-3",
        sm: "h-8 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-5 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
