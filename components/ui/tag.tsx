import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** XP chip: small white tag with a thin bevel-shadow border. */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-button border border-bevel-shadow bg-surface px-1.5 text-system text-text",
        className,
      )}
    >
      {children}
    </span>
  )
}
