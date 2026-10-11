const WARM_STATE_KEY = "nfl-offline-warm";
const LAST_SYNCED_KEY = "nfl-offline-synced";
const WARM_INTERVAL_MS = 30 * 60 * 1000;

export const LAST_SYNCED_EVENT = "nfl-offline-synced";

// The worker only saves pages for offline use in production builds, so dev servers and HMR are never intercepted
export const OFFLINE_CACHE_ENABLED = process.env.NODE_ENV === "production";

export type WarmState = {
  at: number;
  userId: number;
  week: null | number;
};

export const registerServiceWorker = (): Promise<ServiceWorkerRegistration> =>
  navigator.serviceWorker.register(OFFLINE_CACHE_ENABLED ? "/sw.js?offline=1" : "/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });

// Saved pages are personal, so they are removed on sign out and when a different user signs in.
// The static cache only holds the offline page, which is not personal and must survive.
export const clearOfflineCaches = async (): Promise<void> => {
  if (!("caches" in window)) {
    return;
  }

  try {
    const names = await window.caches.keys();

    await Promise.all(
      names
        .filter((name) => name.startsWith("nfl-") && !name.startsWith("nfl-static"))
        .map((name) => window.caches.delete(name)),
    );
  } catch (error) {
    // Must never block signing out
    console.error("Failed to clear saved pages", error);
  }
};

export const isWarmDue = (state: null | WarmState, userId: number, week: null | number, now: number): boolean =>
  !state || state.userId !== userId || state.week !== week || now - state.at > WARM_INTERVAL_MS;

export const readWarmState = (): null | WarmState => {
  try {
    const raw = window.localStorage.getItem(WARM_STATE_KEY);

    return raw ? (JSON.parse(raw) as WarmState) : null;
  } catch {
    return null;
  }
};

export const writeWarmState = (state: WarmState): void => {
  try {
    window.localStorage.setItem(WARM_STATE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private mode); warming just runs again next time
  }
};

export const writeLastSynced = (at: number): void => {
  try {
    window.localStorage.setItem(LAST_SYNCED_KEY, String(at));
  } catch {
    // Display-only, safe to skip
  }

  window.dispatchEvent(new Event(LAST_SYNCED_EVENT));
};

export const readLastSynced = (): null | string => {
  try {
    return window.localStorage.getItem(LAST_SYNCED_KEY);
  } catch {
    return null;
  }
};
