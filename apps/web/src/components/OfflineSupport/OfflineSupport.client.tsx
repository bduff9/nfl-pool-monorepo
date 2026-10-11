"use client";
import "client-only";

import { useQueryState } from "nuqs";
import { type FC, useEffect, useRef } from "react";

import { useIsOffline } from "@/lib/hooks/useIsOffline";
import {
  clearOfflineCaches,
  isWarmDue,
  OFFLINE_CACHE_ENABLED,
  readWarmState,
  type WarmState,
  writeLastSynced,
  writeWarmState,
} from "@/lib/serviceWorker";
import { isUserSwitch } from "@/lib/userSwitch";
import { weekParser } from "@/lib/weekParser";

const WARM_DELAY_MS = 3000;
const MODIFIER_KEYS = ["altKey", "ctrlKey", "metaKey", "shiftKey"] as const;

const clearForOtherUser = async (state: null | WarmState, userId: number): Promise<void> => {
  if (state && state.userId !== userId) {
    await clearOfflineCaches();
  }
};

const warmIfDue = async (userId: number, week: null | number): Promise<void> => {
  if (!navigator.onLine) {
    return;
  }

  const state = readWarmState();

  await clearForOtherUser(state, userId);

  if (!isWarmDue(state, userId, week, Date.now())) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  registration.active?.postMessage({ type: "WARM_CACHE", week });
  writeWarmState({ at: Date.now(), userId, week });
};

// Saves the informational pages shortly after load, and again whenever the app returns to the foreground
const useWarmOfflineCache = (userId: number, week: null | number): void => {
  useEffect(() => {
    if (!OFFLINE_CACHE_ENABLED) {
      return;
    }

    const run = (): void => {
      warmIfDue(userId, week).catch((error) => console.error("Failed to save pages for offline use", error));
    };
    const onVisibilityChange = (): void => {
      if (document.visibilityState === "visible") {
        run();
      }
    };
    const timer = window.setTimeout(run, WARM_DELAY_MS);

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [userId, week]);
};

const useServiceWorker = (): void => {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const onMessage = (event: MessageEvent): void => {
      if (event.data?.type === "CACHE_WARMED" && typeof event.data.at === "number") {
        writeLastSynced(event.data.at);
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);

    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);
};

const findAnchor = (event: MouseEvent): HTMLAnchorElement | null =>
  event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;

const isInternalNavigation = (anchor: HTMLAnchorElement): boolean =>
  anchor.target !== "_blank" && !anchor.hasAttribute("download") && anchor.origin === window.location.origin;

const isCurrentPage = (anchor: HTMLAnchorElement): boolean =>
  anchor.pathname === window.location.pathname && anchor.search === window.location.search;

const isNavigableAnchor = (anchor: HTMLAnchorElement): boolean =>
  isInternalNavigation(anchor) && !isCurrentPage(anchor);

const isPlainLeftClick = (event: MouseEvent): boolean =>
  !event.defaultPrevented && event.button === 0 && !MODIFIER_KEYS.some((key) => event[key]);

const isEligibleClick = (event: MouseEvent, isOffline: boolean): boolean =>
  isOffline && Boolean(navigator.serviceWorker.controller) && isPlainLeftClick(event);

const getInterceptedAnchor = (event: MouseEvent, isOffline: boolean): HTMLAnchorElement | null => {
  if (!isEligibleClick(event, isOffline)) {
    return null;
  }

  const anchor = findAnchor(event);

  return anchor && isNavigableAnchor(anchor) ? anchor : null;
};

// Next's in-app navigation can't be answered from the saved pages, so while offline a link tap becomes a normal
// page load that the service worker serves from its saved copy (or the offline page)
const useOfflineLinkNavigation = (): void => {
  const isOffline = useIsOffline();
  const isOfflineRef = useRef(isOffline);

  useEffect(() => {
    isOfflineRef.current = isOffline;
  }, [isOffline]);

  useEffect(() => {
    if (!OFFLINE_CACHE_ENABLED) {
      return;
    }

    const onClick = (event: MouseEvent): void => {
      const anchor = getInterceptedAnchor(event, isOfflineRef.current);

      if (!anchor) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.assign(anchor.href);
    };

    document.addEventListener("click", onClick, true);

    return () => document.removeEventListener("click", onClick, true);
  }, []);
};

const useReloadOnUserSwitch = (userId: number): void => {
  useEffect(() => {
    if (isUserSwitch(userId)) {
      window.location.reload();
    }
  }, [userId]);
};

type Props = {
  userId: number;
};

const OfflineSupport: FC<Props> = ({ userId }) => {
  const [week] = useQueryState("week", weekParser);

  useReloadOnUserSwitch(userId);
  useServiceWorker();
  useWarmOfflineCache(userId, week);
  useOfflineLinkNavigation();

  return null;
};

export default OfflineSupport;
