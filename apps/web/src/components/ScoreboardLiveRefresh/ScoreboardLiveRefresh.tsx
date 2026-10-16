"use client";

import { useRouter } from "next/navigation";
import { type FC, useEffect } from "react";

import { useWakeLock } from "@/lib/hooks/useWakeLock";
import { refreshWithTransition } from "@/lib/refreshTransition";

const LIVE_POLL_MS = 5_000;

type ScoreboardLiveRefreshProps = {
  enabled: boolean;
};

const ScoreboardLiveRefresh: FC<ScoreboardLiveRefreshProps> = ({ enabled }) => {
  const router = useRouter();

  const wakeLockStatus = useWakeLock(enabled);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        refreshWithTransition(router);
      }
    };

    // Polling pauses while the page is hidden and catches up immediately once it is visible again.
    const id = window.setInterval(refreshIfVisible, LIVE_POLL_MS);

    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [enabled, router]);

  // Temporary diagnostics: only a phone where the lock fails sees this
  if (!wakeLockStatus.startsWith("refused") && wakeLockStatus !== "unsupported") {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-3 z-50 max-w-[90vw] rounded bg-black/80 px-2 py-1 text-xs text-white">
      wake lock: {wakeLockStatus}
    </div>
  );
};

export default ScoreboardLiveRefresh;
