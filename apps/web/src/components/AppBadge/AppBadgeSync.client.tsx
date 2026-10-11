"use client";
import "client-only";

import { type FC, useEffect } from "react";

type Props = {
  count: number;
};

const syncBadge = async (count: number): Promise<void> => {
  try {
    await (count > 0 ? navigator.setAppBadge(count) : navigator.clearAppBadge());
  } catch (error) {
    // iOS only allows badging once notification permission is granted; nothing to recover from, but leave a trace
    console.warn("Could not update the app badge", error);
  }
};

// Mirrors the number of pending actions onto the installed app's icon. Unsupported browsers ignore it.
const AppBadgeSync: FC<Props> = ({ count }) => {
  useEffect(() => {
    if (!("setAppBadge" in navigator)) {
      return;
    }

    syncBadge(count);
  }, [count]);

  return null;
};

export default AppBadgeSync;
