import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * XP push button (DESIGN-GUIDELINES → Component Guidelines): beige gradient,
 * 1px dark-blue border, amber inner glow on hover, blue inner ring when it is
 * the default/focused button, plus the classic dotted focus rectangle.
 */
const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap",
    "h-push-button-h min-w-push-button-w rounded-button border border-button-border px-3",
    "bg-button-gradient font-sans text-system text-text",
    "outline-none hover:shadow-button-hover active:bg-button-pressed-gradient",
    "focus-visible:shadow-button-default focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-ring",
    "focus-visible:after:pointer-events-none focus-visible:after:absolute focus-visible:after:inset-[3px] focus-visible:after:border focus-visible:after:border-dotted focus-visible:after:border-text",
    "disabled:pointer-events-none disabled:text-text-disabled",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        /** Regular push button. */
        default: "",
        /** The dialog's default action: permanent blue inner ring. */
        primary: "shadow-button-default",
        /** Text link styled as a hyperlink, no button chrome. */
        link: "h-auto min-w-0 border-0 bg-none px-0 text-link underline hover:shadow-none active:bg-none focus-visible:shadow-none focus-visible:after:hidden",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      className={cn(buttonVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
