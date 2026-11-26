import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * XP group box: a thin rounded outline with its caption sitting on the top
 * border (a real <fieldset>/<legend>, so the grouping is announced).
 */
export function GroupBox({
  title,
  children,
  className,
}: {
  title: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <fieldset
      className={cn(
        "min-w-0 rounded-groupbox border border-groupbox-border px-3 pb-3 pt-1",
        className,
      )}
    >
      <legend className="px-1 text-system font-bold text-link">{title}</legend>
      {children}
    </fieldset>
  )
}
