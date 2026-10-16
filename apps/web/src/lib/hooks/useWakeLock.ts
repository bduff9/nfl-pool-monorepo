"use client";

import { useEffect } from "react";

import { getWakeLockAction } from "@/lib/liveScores/wakeLockPolicy";

const requestScreenLock = async (): Promise<WakeLockSentinel | null> => {
  try {
    return await navigator.wakeLock.request("screen");
  } catch {
    // Denied (iOS refuses until the user has tapped the page, or on low battery); retried on the next tap.
    return null;
  }
};

const releaseQuietly = async (sentinel: WakeLockSentinel | null): Promise<void> => {
  try {
    await sentinel?.release();
  } catch {
    // Already released by the browser.
  }
};

// Keeps the screen awake while `isLive`. The browser releases the lock whenever the page is hidden, so it is
// re-requested on visibilitychange and released when no game is live or on cleanup.
const startWakeLock = (isLive: boolean): (() => void) => {
  let sentinel: WakeLockSentinel | null = null;
  let isRequesting = false;
  let isDisposed = false;

  const isHeld = (): boolean => isRequesting || (sentinel !== null && !sentinel.released);

  const acquire = async (): Promise<void> => {
    isRequesting = true;
    const acquired = await requestScreenLock();

    isRequesting = false;
    sentinel = isDisposed ? null : acquired;

    if (isDisposed) {
      await releaseQuietly(acquired);
      return;
    }

    // The system can drop the lock while the page stays visible (e.g. low power mode); take it again
    acquired?.addEventListener("release", onRelease);
  };

  const release = async (): Promise<void> => {
    const held = sentinel;

    sentinel = null;
    await releaseQuietly(held);
  };

  const onRelease = (): void => {
    if (!isDisposed) {
      void sync();
    }
  };

  const sync = async (): Promise<void> => {
    const action = getWakeLockAction({
      isHeld: isHeld(),
      isLive,
      isSupported: true,
      isVisible: document.visibilityState === "visible",
    });

    if (action === "release") {
      await release();
    }

    if (action === "acquire") {
      await acquire();
    }
  };

  const onVisibilityChange = (): void => {
    void sync();
  };

  // A request refused without a recent tap (iOS) is retried on the next touch, focus or page restore
  const retryEvents = ["visibilitychange", "pointerdown", "focus", "pageshow"] as const;

  for (const event of retryEvents) {
    window.addEventListener(event, onVisibilityChange);
  }

  void sync();

  return () => {
    isDisposed = true;

    for (const event of retryEvents) {
      window.removeEventListener(event, onVisibilityChange);
    }

    void releaseQuietly(sentinel);
    sentinel = null;
  };
};

export const useWakeLock = (isLive: boolean): void => {
  useEffect(() => {
    if (!isLive || !("wakeLock" in navigator)) {
      return;
    }

    return startWakeLock(isLive);
  }, [isLive]);
};
