"use client";
import "client-only";

import { type FC, useEffect } from "react";

type Props = {
  count: number;
};

// Temporary diagnostics for the iOS badge not showing: records what the page saw and what the browser answered
const logBadgeEnvironment = (count: number): void => {
  console.info("App badge sync", {
    count,
    permission: "Notification" in window ? Notification.permission : "unsupported",
    standalone: window.matchMedia("(display-mode: standalone)").matches,
    supported: "setAppBadge" in navigator,
  });
};

const syncBadge = async (count: number): Promise<void> => {
  try {
    await (count > 0 ? navigator.setAppBadge(count) : navigator.clearAppBadge());
    console.info("App badge set", count);
  } catch (error) {
    // iOS only allows badging once notification permission is granted; nothing to recover from, but leave a trace
    console.warn("Could not update the app badge", error);
  }
};

// Mirrors the number of pending actions onto the installed app's icon. Unsupported browsers ignore it.
const AppBadgeSync: FC<Props> = ({ count }) => {
  useEffect(() => {
    logBadgeEnvironment(count);

    if (!("setAppBadge" in navigator)) {
      return;
    }

    syncBadge(count);
  }, [count]);

  return null;
};

export default AppBadgeSync;
