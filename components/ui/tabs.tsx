"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/** XP tabs: raised tabs on button-face; the selected tab joins its panel. */
function Tabs(props: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" {...props} />
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("relative z-[1] flex items-end gap-0.5 pl-1", className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "-mb-px rounded-t-button border border-b-0 border-bevel-shadow bg-button-face px-2 py-0.5 text-system text-text",
        "hover:shadow-[inset_0_2px_var(--color-hot)] focus-light",
        "data-[state=active]:bg-surface data-[state=active]:pb-1 data-[state=active]:shadow-[inset_0_2px_var(--color-hot-strong)]",
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("border border-bevel-shadow bg-surface p-3 outline-none focus-light", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
