import { cn } from "@/lib/utils";

/** "DouglasOS" wordmark: white name, amber "OS" (brand, not a product edition). */
export function Wordmark({ className }: { className?: string }) {
  return (
    <p className={cn("font-title text-boot text-text-inverse", className)}>
      Douglas<span className="text-hot">OS</span>
    </p>
  );
}
