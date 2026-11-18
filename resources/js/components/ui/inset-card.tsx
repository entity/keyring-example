import * as React from "react"

import { cn } from "@/lib/utils"

/*
 * entity/ui's metric card: a tinted outer card that holds its title and
 * actions, with the content in a white card set inside it. `wash` adds a
 * soft colour wash to the top, for a page's lead card.
 */
function InsetCard({
  className,
  wash = false,
  ...props
}: React.ComponentProps<"section"> & { wash?: boolean }) {
  return (
    <section
      data-slot="inset-card"
      className={cn(
        "bg-tint shadow-card flex flex-col gap-1 rounded-xl p-1",
        wash && "bg-wash",
        className
      )}
      {...props}
    />
  )
}

function InsetCardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="inset-card-header"
      className={cn(
        "flex flex-col gap-3 px-3 pt-2.5 pb-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
        className
      )}
      {...props}
    />
  )
}

function InsetCardTitle({
  className,
  as: Comp = "h2",
  ...props
}: React.ComponentProps<"h2"> & { as?: "h2" | "h3" }) {
  return (
    <Comp
      data-slot="inset-card-title"
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    />
  )
}

function InsetCardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="inset-card-description"
      className={cn("text-muted-foreground mt-0.5 text-[13px] leading-5", className)}
      {...props}
    />
  )
}

function InsetCardBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="inset-card-body"
      className={cn("bg-card shadow-inset rounded-lg", className)}
      {...props}
    />
  )
}

/** A list of rows inside the white card, split by fine lines. */
function InsetCardList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="inset-card-list"
      className={cn(
        "bg-card shadow-inset divide-border/70 divide-y rounded-lg",
        className
      )}
      {...props}
    />
  )
}

export {
  InsetCard,
  InsetCardBody,
  InsetCardDescription,
  InsetCardHeader,
  InsetCardList,
  InsetCardTitle,
}
