/// <reference lib="esnext" />
/// <reference lib="webworker" />
import type { PrecacheEntry, SerwistGlobalConfig, SerwistPlugin } from "serwist";
import { CacheFirst, ExpirationPlugin, NetworkFirst, NetworkOnly, Serwist, StaleWhileRevalidate } from "serwist";

import { ASSETS_CACHE, OFFLINE_URL, PAGES_CACHE } from "@/lib/offline/cacheNames";
import {
  canBadge,
  extractImageUrls,
  findNewestSibling,
  isCacheablePath,
  isPublicAsset,
  isStorableHtml,
  PAGE_NETWORK_TIMEOUT_SECONDS,
  resolveTargetUrl,
  trimToNewest,
  warmUrls,
} from "@/lib/offline/swCaching";

// Serwist injects the precache list onto the worker global at build time; declaration merging is the documented way
// to type it.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Saving pages and assets for offline use is only on in production builds (registered with ?offline=1), so dev servers
// and HMR are never intercepted. Push notifications and the app badge work either way.
const OFFLINE_ENABLED = new URL(self.location.href).searchParams.get("offline") === "1";
const DAY_SECONDS = 24 * 60 * 60;
const WARM_CONCURRENCY = 4;

// Only real pages are saved
const savePagesWhenStorable: SerwistPlugin = {
  cacheWillUpdate: async ({ response }) => (isStorableHtml(response) ? response : null),
};

// When a page was never saved for the requested week, show the newest saved copy of it
const fallBackToNewestSavedPage: SerwistPlugin = {
  handlerDidError: async ({ request }) => findNewestSibling(await self.caches.open(PAGES_CACHE), request.url),
};

// Vercel Skew Protection appends ?dpl=<deployment id> to build file requests, but the precache list has bare URLs
const ignoreDeploymentId: SerwistPlugin = {
  cacheKeyWillBeUsed: async ({ request }) => {
    const url = new URL(request.url);

    url.searchParams.delete("dpl");

    return url.href;
  },
};

const serwist = new Serwist({
  clientsClaim: true,
  // Served for any page that can't be loaded or found in the saved copies
  fallbacks: { entries: [{ matcher: ({ request }) => request.destination === "document", url: OFFLINE_URL }] },
  navigationPreload: true,
  precacheEntries: self.__SW_MANIFEST ?? [],
  precacheOptions: { ignoreURLParametersMatching: [/^dpl$/] },
  runtimeCaching: [
    // Informational pages: always try the network first, fall back to the saved copy
    {
      handler: new NetworkFirst({
        cacheName: PAGES_CACHE,
        matchOptions: { ignoreVary: true },
        networkTimeoutSeconds: PAGE_NETWORK_TIMEOUT_SECONDS,
        plugins: [savePagesWhenStorable, fallBackToNewestSavedPage],
      }),
      matcher: ({ request, sameOrigin, url }) =>
        sameOrigin && request.destination === "document" && isCacheablePath(url.pathname),
    },
    // Every other page (make picks, profile, admin, sign in) is never saved, but still gets the offline page when
    // there is no connection
    {
      handler: new NetworkOnly(),
      matcher: ({ request, sameOrigin }) => sameOrigin && request.destination === "document",
    },
    // Hashed build files that the precache no longer has: a page saved under an older deploy still needs its old files
    {
      handler: new CacheFirst({
        cacheName: ASSETS_CACHE,
        plugins: [ignoreDeploymentId, new ExpirationPlugin({ maxAgeSeconds: 30 * DAY_SECONDS, maxEntries: 300 })],
      }),
      matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith("/_next/static/"),
    },
    // Team logos and other public images
    {
      handler: new StaleWhileRevalidate({
        cacheName: ASSETS_CACHE,
        plugins: [new ExpirationPlugin({ maxAgeSeconds: 30 * DAY_SECONDS, maxEntries: 200 })],
      }),
      matcher: ({ sameOrigin, url }) =>
        sameOrigin && (url.pathname.startsWith("/_next/image") || isPublicAsset(url.pathname)),
    },
  ],
  // Updates take over only when the user accepts the reload prompt (SKIP_WAITING below), never mid-session
  skipWaiting: false,
});

if (OFFLINE_ENABLED) {
  serwist.addEventListeners();
}

// Saving pages ahead of time: the page asks for the informational pages to be saved so they work offline even if they
// were never opened. Their scripts and styles are already precached.

// Batches run one after another on purpose: bounded concurrency keeps this from flooding the server
const inBatches = async <T>(items: Array<T>, task: (item: T) => Promise<void>): Promise<void> => {
  for (let i = 0; i < items.length; i += WARM_CONCURRENCY) {
    // react-doctor-disable-next-line react-doctor/async-await-in-loop -- sequential batches are the point
    await Promise.allSettled(items.slice(i, i + WARM_CONCURRENCY).map(task));
  }
};

const saveImage = async (url: string): Promise<void> => {
  const cache = await self.caches.open(ASSETS_CACHE);

  if (await cache.match(url)) {
    return;
  }

  const response = await fetch(url);

  if (response.ok) {
    await cache.put(url, response);
  }
};

const savePage = async (url: string): Promise<void> => {
  const response = await fetch(url, { cache: "no-store", credentials: "same-origin", redirect: "manual" });

  if (!response.ok || !isStorableHtml(response)) {
    return;
  }

  const cache = await self.caches.open(PAGES_CACHE);

  await cache.put(url, response.clone());
  await inBatches(extractImageUrls(await response.text()), saveImage);
};

const notifyWarmed = async (): Promise<void> => {
  const windowClients = await self.clients.matchAll({ type: "window" });

  for (const client of windowClients) {
    client.postMessage({ at: Date.now(), type: "CACHE_WARMED" });
  }
};

const warmCache = async (week: unknown): Promise<void> => {
  await inBatches(warmUrls(week), savePage);
  await trimToNewest(await self.caches.open(PAGES_CACHE));
  await notifyWarmed();
};

const messageHandlers: Record<string, (event: ExtendableMessageEvent) => void> = {
  // iOS is more dependable at showing a badge set from the worker than one set from the page
  SET_BADGE: (event) => {
    event.waitUntil(updateBadge(event.data.count));
  },
  SKIP_WAITING: () => {
    self.skipWaiting();
  },
  WARM_CACHE: (event) => {
    if (OFFLINE_ENABLED) {
      event.waitUntil(warmCache(event.data.week));
    }
  },
};

self.addEventListener("message", (event) => {
  // Only our own pages may drive the worker
  if (event.origin === self.location.origin) {
    messageHandlers[String(event.data?.type)]?.(event);
  }
});

// Push notifications and the app badge

type BadgeNavigator = {
  clearAppBadge?: () => Promise<void>;
  setAppBadge?: (count: number) => Promise<void>;
};

type PushPayload = { badge?: number; body?: string; icon?: string; tag?: string; title?: string; url?: string };

const FALLBACK_NOTIFICATION = { body: "Open the app to see what changed.", title: "NFL Confidence Pool" };

const parsePayload = (data: PushMessageData | null): PushPayload => {
  try {
    return (data?.json() ?? {}) as PushPayload;
  } catch {
    return {};
  }
};

const applyBadge = (badge: BadgeNavigator, count: number): Promise<void> | undefined =>
  count > 0 ? badge.setAppBadge?.(count) : badge.clearAppBadge?.();

const updateBadge = async (count: unknown): Promise<void> => {
  const badge = self.navigator as unknown as BadgeNavigator;

  if (!canBadge(count, Boolean(badge.setAppBadge))) {
    return;
  }

  try {
    await applyBadge(badge, count);
  } catch {
    // Badges need notification permission on some platforms; not worth failing the notification over
  }
};

const notificationOptions = (payload: PushPayload): NotificationOptions => ({
  body: payload.body ?? FALLBACK_NOTIFICATION.body,
  data: { dateOfArrival: Date.now(), primaryKey: "2", url: payload.url },
  icon: payload.icon ?? "/football.png",
  ...(payload.tag ? { tag: payload.tag } : {}),
});

self.addEventListener("push", (event) => {
  // iOS revokes subscriptions that receive pushes without showing anything, so always show a notification
  const payload = parsePayload(event.data);

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(payload.title ?? FALLBACK_NOTIFICATION.title, notificationOptions(payload)),
      updateBadge(payload.badge),
    ]),
  );
});

// Only controlled windows can be navigated, so fall back to opening the destination directly
const navigateWindow = async (client: WindowClient, targetUrl: string): Promise<WindowClient | null> => {
  const focused = await client.focus();

  if (focused.url === targetUrl) {
    return focused;
  }

  try {
    return await focused.navigate(targetUrl);
  } catch {
    return self.clients.openWindow(targetUrl);
  }
};

const openOrFocus = async (targetUrl: string): Promise<WindowClient | null> => {
  const windowClients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
  const existing = windowClients.find((client) => new URL(client.url).origin === self.location.origin);

  return existing ? navigateWindow(existing, targetUrl) : self.clients.openWindow(targetUrl);
};

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(openOrFocus(resolveTargetUrl(event.notification.data?.url, self.location.origin)));
});
