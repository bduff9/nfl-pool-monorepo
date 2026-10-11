// Service worker: web push, an app badge, and an offline copy of the informational pages.
//
// Offline caching is only active when the worker is registered with ?offline=1 (production builds), so dev
// servers and HMR are never intercepted. Only page navigations and static assets are handled here; Next's own
// data requests (RSC, prefetch, server actions) are never touched, which keeps its offline detection accurate.

const PAGES_CACHE = "nfl-pages-v1";
const ASSETS_CACHE = "nfl-assets-v1";
// Holds the offline page only, so signing out (which clears the personal caches) never removes it
const STATIC_CACHE = "nfl-static-v1";
const OFFLINE_URL = "/offline.html";
const OFFLINE_ENABLED = new URL(self.location.href).searchParams.get("offline") === "1";
const NETWORK_TIMEOUT_MS = 6000;
const MAX_CACHED_ASSETS = 400;
const MAX_WARMED_ASSETS = 150;
const WARM_CONCURRENCY = 4;

// Informational pages that are safe to show a saved copy of. Making picks, survivor picks, the profile and
// admin pages are deliberately excluded: they must never show stale data as if it were editable.
const CACHEABLE_PATHS = [
  "/",
  "/head-to-head",
  "/history",
  "/overall",
  "/picks/view",
  "/picks/viewall",
  "/scoreboard",
  "/support",
  "/survivor/view",
  "/users/payments",
  "/weekly",
];
const PUBLIC_ASSET = /^\/(NFLLogos\/|apple-touch|bkgd-pitch|favicon|football|icon-)/;
const ASSET_URL_IN_HTML = /\/_next\/(?:static\/[^"'\\\s<>)]+|image\?[^"'\\\s<>)]+)/g;

const isCacheablePath = (pathname) => CACHEABLE_PATHS.includes(pathname);
const isImmutableAsset = (url) => url.pathname.startsWith("/_next/static/");
const isStaticAsset = (url) =>
  isImmutableAsset(url) || url.pathname.startsWith("/_next/image") || PUBLIC_ASSET.test(url.pathname);

const isFreshResponse = (response) => response.ok && response.type !== "opaqueredirect" && !response.redirected;
const isHtml = (response) => (response.headers.get("content-type") || "").includes("text/html");
const isStorableHtml = (response) => isFreshResponse(response) && isHtml(response);

const extractAssetUrls = (html) => {
  const matches = html.replaceAll("\\u0026", "&").match(ASSET_URL_IN_HTML) || [];

  return [...new Set(matches.map((match) => match.replaceAll("&amp;", "&")))];
};

const withTimeout = (promise, ms) =>
  ms > 0
    ? Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))])
    : promise;

const trimCache = async (cache, max) => {
  const keys = await cache.keys();

  await Promise.all(keys.slice(0, Math.max(keys.length - max, 0)).map((key) => cache.delete(key)));
};

// Pages

const findCachedPage = async (url) => {
  if (!isCacheablePath(url.pathname)) {
    return undefined;
  }

  const cache = await caches.open(PAGES_CACHE);
  const exact = await cache.match(url.href, { ignoreVary: true });

  if (exact) {
    return exact;
  }

  // Fall back to the newest saved copy of this page for another week, the page itself shows which week it is
  const keys = await cache.keys();
  const sibling = keys.filter((key) => new URL(key.url).pathname === url.pathname).pop();

  return sibling ? cache.match(sibling, { ignoreVary: true }) : undefined;
};

const storePage = async (key, response) => {
  if (!isCacheablePath(new URL(key, self.location.origin).pathname) || !isStorableHtml(response)) {
    return;
  }

  const cache = await caches.open(PAGES_CACHE);

  await cache.put(key, response.clone());
};

const offlineFallback = async () =>
  (await caches.match(OFFLINE_URL)) || new Response("You are offline.", { status: 503 });

const handleNavigation = async (request, url) => {
  const cached = await findCachedPage(url);

  try {
    const response = await withTimeout(fetch(request), cached ? NETWORK_TIMEOUT_MS : 0);

    await storePage(request.url, response);

    return response;
  } catch {
    return cached || offlineFallback();
  }
};

// Assets

const fetchAndStoreAsset = async (request, cache) => {
  try {
    const response = await fetch(request);

    if (response.ok) {
      await cache.put(request.url || request, response.clone());
      await trimCache(cache, MAX_CACHED_ASSETS);
    }

    return response;
  } catch {
    return undefined;
  }
};

const firstAvailable = async (cached, refreshed) => cached || (await refreshed) || Response.error();

const handleAsset = async (request, url) => {
  const cache = await caches.open(ASSETS_CACHE);
  const cached = await cache.match(request.url, { ignoreVary: true });

  if (cached && isImmutableAsset(url)) {
    return cached;
  }

  return firstAvailable(cached, fetchAndStoreAsset(request, cache));
};

const shouldHandle = (request, url) =>
  OFFLINE_ENABLED && request.method === "GET" && url.origin === self.location.origin;

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (!shouldHandle(request, url)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request, url));
  } else if (isStaticAsset(url)) {
    event.respondWith(handleAsset(request, url));
  }
});

// Install, activate

self.addEventListener("install", (event) => {
  if (!OFFLINE_ENABLED) {
    return;
  }

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const current = [PAGES_CACHE, ASSETS_CACHE, STATIC_CACHE];
  const removeStale = async () => {
    const names = await caches.keys();

    await Promise.all(
      names.filter((name) => name.startsWith("nfl-") && !current.includes(name)).map((name) => caches.delete(name)),
    );
    await self.clients.claim();
  };

  event.waitUntil(removeStale());
});

// Cache warming: the page asks for the informational pages to be saved ahead of time, along with the scripts,
// styles and images they reference, so they work offline even if they were never opened.

const isValidWeek = (week) => Number.isInteger(week) && week >= 1 && week <= 18;

// Batches run one after another on purpose: bounded concurrency keeps warming from flooding the server
const inBatches = async (items, size, task) => {
  for (let i = 0; i < items.length; i += size) {
    // react-doctor-disable-next-line react-doctor/async-await-in-loop -- sequential batches are the point
    await Promise.allSettled(items.slice(i, i + size).map(task));
  }
};

const warmAssets = async (urls) => {
  const cache = await caches.open(ASSETS_CACHE);
  const checked = await Promise.all(
    urls.slice(0, MAX_WARMED_ASSETS).map(async (url) => ((await cache.match(url, { ignoreVary: true })) ? null : url)),
  );

  await inBatches(
    checked.filter(Boolean),
    WARM_CONCURRENCY,
    (url) => fetchAndStoreAsset(new Request(new URL(url, self.location.origin).href), cache),
  );
};

const warmPage = async (url) => {
  const response = await fetch(url, { cache: "no-store", credentials: "same-origin", redirect: "manual" });

  if (!isStorableHtml(response)) {
    return;
  }

  await storePage(url, response);
  await warmAssets(extractAssetUrls(await response.text()));
};

const notifyWarmed = async () => {
  const windowClients = await self.clients.matchAll({ type: "window" });

  for (const client of windowClients) {
    client.postMessage({ at: Date.now(), type: "CACHE_WARMED" });
  }
};

const warmCache = async (week) => {
  const urls = CACHEABLE_PATHS.map((path) => (isValidWeek(week) ? `${path}?week=${week}` : path));

  await inBatches(urls, WARM_CONCURRENCY, warmPage);

  await notifyWarmed();
};

self.addEventListener("message", (event) => {
  if (OFFLINE_ENABLED && event.data?.type === "WARM_CACHE") {
    event.waitUntil(warmCache(event.data.week));
  }
});

// Push notifications

const canBadge = (count) => Boolean(self.navigator.setAppBadge) && typeof count === "number";
const applyBadge = (count) => (count > 0 ? self.navigator.setAppBadge(count) : self.navigator.clearAppBadge());

const updateBadge = async (count) => {
  if (!canBadge(count)) {
    return;
  }

  try {
    await applyBadge(count);
  } catch {
    // Badges need notification permission on some platforms; not worth failing the notification over
  }
};

self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      data: {
        dateOfArrival: Date.now(),
        primaryKey: "2",
        url: data.url,
      },
      icon: data.icon || "/football.png",
      vibrate: [100, 50, 100],
    };

    if (data.tag) {
      options.tag = data.tag;
    }

    event.waitUntil(Promise.all([self.registration.showNotification(data.title, options), updateBadge(data.badge)]));
  }
});

// Same-origin only, so a payload can never send the user to another site
const resolveTargetUrl = (url) => {
  try {
    const target = new URL(url || "/", self.location.origin);

    return target.origin === self.location.origin ? target.href : self.location.origin;
  } catch {
    return self.location.origin;
  }
};

// Only controlled windows can be navigated, so fall back to opening the destination directly
const navigateWindow = async (client, targetUrl) => {
  const focused = await client.focus();

  if (!focused || focused.url === targetUrl) {
    return focused;
  }

  try {
    return await focused.navigate(targetUrl);
  } catch {
    return clients.openWindow(targetUrl);
  }
};

const openOrFocus = async (targetUrl) => {
  const windowClients = await clients.matchAll({ includeUncontrolled: true, type: "window" });
  const existing = windowClients.find((client) => new URL(client.url).origin === self.location.origin);

  return existing ? navigateWindow(existing, targetUrl) : clients.openWindow(targetUrl);
};

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(openOrFocus(resolveTargetUrl(event.notification.data?.url)));
});
