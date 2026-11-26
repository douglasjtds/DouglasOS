"use client";

import dynamic from "next/dynamic";
import { useTrashNoticeStore } from "@/lib/store/trashNoticeStore";

// The balloon (and the shell actions it imports) loads only once a rescue
// line actually needs it, i.e. after a "delete" while mini Douglas is dismissed.
const TrashNotice = dynamic(() => import("@/components/os/desktop/TrashNotice"), { ssr: false });

/** Mounts the Recycle Bin's rescue balloon on demand (stage 6). */
export function LazyTrashNotice() {
  const hasNotice = useTrashNoticeStore((s) => s.notice !== null);
  return hasNotice ? <TrashNotice /> : null;
}
