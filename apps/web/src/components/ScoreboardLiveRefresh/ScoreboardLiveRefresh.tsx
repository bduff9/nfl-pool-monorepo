"use client";

import { useRouter } from "next/navigation";
import { type FC, useEffect } from "react";

const LIVE_POLL_MS = 15_000;

type ScoreboardLiveRefreshProps = {
  enabled: boolean;
};

const ScoreboardLiveRefresh: FC<ScoreboardLiveRefreshProps> = ({ enabled }) => {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const id = window.setInterval(() => {
      router.refresh();
    }, LIVE_POLL_MS);

    return () => {
      window.clearInterval(id);
    };
  }, [enabled, router]);

  return null;
};

export default ScoreboardLiveRefresh;
