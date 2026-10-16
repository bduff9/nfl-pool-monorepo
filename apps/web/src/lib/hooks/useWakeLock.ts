"use client";

import { useEffect, useState } from "react";

import { getWakeLockAction } from "@/lib/liveScores/wakeLockPolicy";

type Report = (status: string) => void;

const requestScreenLock = async (report: Report): Promise<WakeLockSentinel | null> => {
  try {
    const sentinel = await navigator.wakeLock.request("screen");

    report("held");

    return sentinel;
  } catch (error) {
    // Denied (e.g. low battery or no user activation yet); the screen simply sleeps as usual.
    report(`refused: ${error instanceof Error ? `${error.name} ${error.message}` : String(error)}`);

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
const startWakeLock = (isLive: boolean, report: Report): (() => void) => {
  if (!("wakeLock" in navigator)) {
    report("unsupported");

    return () => undefined;
  }

  let sentinel: WakeLockSentinel | null = null;
  let isRequesting = false;
  let isDisposed = false;

  const isHeld = (): boolean => isRequesting || (sentinel !== null && !sentinel.released);

  const acquire = async (): Promise<void> => {
    isRequesting = true;
    const acquired = await requestScreenLock(report);

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

/** Returns the lock's current state as text, so a refused or unsupported lock can be shown on screen. */
export const useWakeLock = (isLive: boolean): string => {
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (!isLive) {
      return;
    }

    return startWakeLock(isLive, setStatus);
  }, [isLive]);

  return isLive ? status : "idle";
};
