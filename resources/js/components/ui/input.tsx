import * as React from "react"

import { cn } from "@/lib/utils"

/*
 * entity/ui's field: a white well with a fine ring and a short drop, that
 * takes an accent ring on focus.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "bg-field shadow-field file:text-foreground placeholder:text-muted-foreground/70 selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md px-3 py-1 text-base transition-[box-shadow] duration-150 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:ring-ring focus-visible:ring-2",
        "aria-invalid:ring-destructive aria-invalid:ring-1 aria-invalid:focus-visible:ring-2",
        className
      )}
      {...props}
    />
  )
}

export { Input }
