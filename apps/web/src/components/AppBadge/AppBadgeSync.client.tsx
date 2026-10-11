"use client";
import "client-only";

import { type FC, useEffect } from "react";

type Props = {
  // null leaves the badge as it is, for views that don't reflect the current week
  count: null | number;
};

// Mirrors the number of pending actions onto the installed app's icon. Unsupported browsers ignore it.
const AppBadgeSync: FC<Props> = ({ count }) => {
  useEffect(() => {
    if (count === null || !("setAppBadge" in navigator)) {
      return;
    }

    const update = count > 0 ? navigator.setAppBadge(count) : navigator.clearAppBadge();

    update.catch((error) => {
      // iOS only allows badging once notification permission is granted; nothing to recover from, but leave a trace
      console.warn("Could not update the app badge", error);
    });
  }, [count]);

  return null;
};

export default AppBadgeSync;
