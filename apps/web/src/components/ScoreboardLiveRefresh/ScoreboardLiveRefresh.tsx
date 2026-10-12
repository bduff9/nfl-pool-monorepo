"use client";

import { useRouter } from "next/navigation";
import { type FC, useEffect } from "react";

import { useWakeLock } from "@/lib/hooks/useWakeLock";

const LIVE_POLL_MS = 30_000;

type ScoreboardLiveRefreshProps = {
  enabled: boolean;
};

const ScoreboardLiveRefresh: FC<ScoreboardLiveRefreshProps> = ({ enabled }) => {
  const router = useRouter();

  useWakeLock(enabled);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
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

  return null;
};

export default ScoreboardLiveRefresh;
