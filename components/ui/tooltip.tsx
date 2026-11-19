"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/** Classic delay before a tooltip appears (DESIGN-GUIDELINES → Tooltip). */
export const TOOLTIP_DELAY_MS = 500

function TooltipProvider(props: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={TOOLTIP_DELAY_MS} {...props} />
}

/**
 * Yellow rectangular tooltip. Wraps one trigger element (asChild) — use it on
 * every icon-only control (Quick Launch, tray, window controls).
 */
function Tooltip({
  content,
  children,
  side = "top",
}: {
  content: React.ReactNode
  children: React.ReactElement
  side?: "top" | "bottom" | "left" | "right"
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={4}
          className={cn(
            "z-[1300] border border-info-border bg-info px-1.5 py-0.5 text-system text-text shadow-balloon",
          )}
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

export { Tooltip, TooltipProvider }
