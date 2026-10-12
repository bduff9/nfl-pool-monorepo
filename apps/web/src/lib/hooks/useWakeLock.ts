"use client";

import { useEffect } from "react";

import { getWakeLockAction } from "@/lib/liveScores/wakeLockPolicy";

const requestScreenLock = async (): Promise<WakeLockSentinel | null> => {
  try {
    return await navigator.wakeLock.request("screen");
  } catch {
    // Denied (e.g. low battery or no user activation yet); the screen simply sleeps as usual.
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
    }
  };

  const release = async (): Promise<void> => {
    const held = sentinel;

    sentinel = null;
    await releaseQuietly(held);
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

  document.addEventListener("visibilitychange", onVisibilityChange);
  void sync();

  return () => {
    isDisposed = true;
    document.removeEventListener("visibilitychange", onVisibilityChange);
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
