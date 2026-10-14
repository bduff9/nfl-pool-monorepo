"use client";

import { useRouter } from "next/navigation";
import { type FC, useEffect, useRef } from "react";

import { shouldRefresh } from "@/lib/foregroundRefresh";
import { refreshWithTransition } from "@/lib/refreshTransition";

// The installed app resumes from the background still showing the data it had when it was last open, so refresh it
// when it comes back to the foreground (throttled so quick app switches don't keep refetching)
const ForegroundRefresh: FC = () => {
  const router = useRouter();
  const lastRefreshAt = useRef<number>(0);

  useEffect(() => {
    const onVisibilityChange = (): void => {
      if (document.visibilityState !== "visible" || !shouldRefresh(lastRefreshAt.current, Date.now())) {
        return;
      }

      lastRefreshAt.current = Date.now();
      refreshWithTransition(router);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router]);

  return null;
};

export default ForegroundRefresh;
