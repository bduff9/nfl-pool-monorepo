"use client";
import "client-only";

import { cn } from "@nfl-pool-monorepo/utils/styles";
import { usePathname, useRouter } from "next/navigation";
import { type FC, useEffect, useRef, useState, useTransition } from "react";
import { PiFootballDuotone } from "react-icons/pi";

import { hapticTap } from "@/lib/haptics";
import { useIsOffline } from "@/lib/hooks/useIsOffline";
import {
  getPullStart,
  getPullUpdate,
  hasReachedThreshold,
  isPullEnabledOn,
  PULL_THRESHOLD_PX,
} from "@/lib/pullToRefresh";

// A refresh that finishes instantly would otherwise remove the spinner before it was seen
const MIN_SPINNER_MS = 700;

const isInstalledApp = (): boolean => window.matchMedia("(display-mode: standalone)").matches;

type Pull = { distance: number; isDragging: boolean };

// Tracks a downward drag that starts at the top of the page and reports how far it has been pulled, and whether a
// finger is still dragging it. Only the installed app needs this: browsers bring their own pull-to-refresh, and the
// installed iOS app has none.
const usePull = (enabled: boolean, onRelease: () => void): Pull => {
  const [pull, setPull] = useState<Pull>({ distance: 0, isDragging: false });
  const startY = useRef<null | number>(null);
  const pullRef = useRef<number>(0);
  const release = useRef(onRelease);

  useEffect(() => {
    release.current = onRelease;
  }, [onRelease]);

  useEffect(() => {
    if (!(enabled && isInstalledApp())) {
      return;
    }

    const update = (distance: number, isDragging: boolean): void => {
      const crossed = hasReachedThreshold(distance) && !hasReachedThreshold(pullRef.current);

      pullRef.current = distance;
      setPull({ distance, isDragging });

      if (crossed) {
        hapticTap();
      }
    };
    const onStart = (event: TouchEvent): void => {
      const target = event.target instanceof Element ? event.target : null;

      startY.current = getPullStart(event.touches, target, window.scrollY);
    };
    const onMove = (event: TouchEvent): void => {
      const touchY = event.touches[0]?.clientY;

      if (startY.current === null || touchY === undefined) {
        return;
      }

      const next = getPullUpdate(startY.current, touchY, window.scrollY);

      startY.current = next.startY;
      update(next.distance, next.startY !== null);
    };
    const onEnd = (): void => {
      const shouldRefresh = startY.current !== null && hasReachedThreshold(pullRef.current);

      startY.current = null;
      update(0, false);

      if (shouldRefresh) {
        release.current();
      }
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);

    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
  }, [enabled]);

  return pull;
};

type PullIndicatorProps = { isDragging: boolean; isSpinning: boolean; offset: number };

// Follows the finger exactly while dragging; once let go it springs back to where it rests (or out of sight), shrinking
// and fading as it leaves
const PullIndicator: FC<PullIndicatorProps> = ({ isDragging, isSpinning, offset }) => {
  const progress = Math.min(1, offset / PULL_THRESHOLD_PX);
  const springBack =
    !isDragging &&
    "transition-[transform,opacity,scale] duration-250 ease-(--ease-out-quint) motion-reduce:transition-none";

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none fixed inset-x-0 z-[55] flex justify-center", springBack)}
      style={{ top: "var(--safe-top)", transform: `translateY(${offset - 44}px)` }}
    >
      <div
        className={cn("rounded-full bg-card p-2 shadow-md", springBack)}
        style={{ opacity: progress, scale: 0.5 + progress / 2 }}
      >
        <PiFootballDuotone
          className={isSpinning ? "size-7 animate-spin text-primary" : "size-7 text-primary"}
          style={isSpinning ? undefined : { transform: `rotate(${progress * 270}deg)` }}
        />
      </div>
    </div>
  );
};

// Wires the pull to a router refresh, and keeps the spinner up for a moment even when the refresh is instant
const usePullToRefresh = (): PullIndicatorProps => {
  const router = useRouter();
  const pathname = usePathname();
  const isOffline = useIsOffline();
  const [isRefreshing, startRefresh] = useTransition();
  const [isHolding, setIsHolding] = useState<boolean>(false);

  const refresh = (): void => {
    setIsHolding(true);
    window.setTimeout(() => setIsHolding(false), MIN_SPINNER_MS);
    startRefresh(() => router.refresh());
  };

  const pull = usePull(isPullEnabledOn(pathname) && !isOffline, refresh);
  const isSpinning = isRefreshing || isHolding;

  return { isDragging: pull.isDragging, isSpinning, offset: isSpinning ? PULL_THRESHOLD_PX : pull.distance };
};

const PullToRefresh: FC = () => {
  const { isDragging, isSpinning, offset } = usePullToRefresh();
  // Mounted from the first pull on, so a released or finished pull can animate away instead of disappearing
  const [hasPulled, setHasPulled] = useState<boolean>(false);

  if (offset > 0 && !hasPulled) {
    setHasPulled(true);
  }

  return hasPulled ? <PullIndicator isDragging={isDragging} isSpinning={isSpinning} offset={offset} /> : null;
};

export default PullToRefresh;
