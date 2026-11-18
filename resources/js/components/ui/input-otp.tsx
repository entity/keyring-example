import { OTPInput, OTPInputContext } from "input-otp"
import * as React from "react"

import { cn } from "@/lib/utils"

/*
 * One real <input> (so autofill, paste, labels and form tests all see a
 * normal field) drawn as a row of separate digit boxes.
 */
const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex w-full items-center justify-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
))
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex min-w-0 flex-1 items-center justify-center gap-1.5 sm:gap-2", className)}
    {...props}
  />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  return (
    <div
      ref={ref}
      data-active={isActive || undefined}
      data-filled={char ? true : undefined}
      className={cn(
        "bg-field shadow-field relative flex aspect-[5/6] max-w-12 min-w-0 flex-1 items-center justify-center rounded-lg text-xl font-medium tabular-nums transition-[box-shadow] duration-150 sm:text-2xl",
        "data-[active]:ring-ring data-[active]:ring-2",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="bg-ring h-6 w-0.5 rounded-full animate-caret-blink motion-reduce:animate-none" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="separator"
    aria-hidden="true"
    className={cn("bg-input h-0.5 w-2.5 shrink-0 rounded-full sm:w-3", className)}
    {...props}
  />
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
