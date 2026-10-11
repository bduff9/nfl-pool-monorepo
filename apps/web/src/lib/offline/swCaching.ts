// Decisions the service worker makes about what to save and where to send people. Kept free of worker globals so they
// can be unit tested; src/sw.ts wires them into Serwist.

const NETWORK_TIMEOUT_SECONDS = 6;
const MAX_SAVED_PAGES = 66;
const MAX_WARMED_IMAGES = 150;
const IMAGE_URL_IN_HTML = /\/_next\/image\?[^"'\\\s<>)]+/g;
const PUBLIC_ASSET = /^\/(NFLLogos\/|apple-touch|bkgd-pitch|favicon|football|icon-)/;

// Informational pages that are safe to show a saved copy of. Making picks, survivor picks, the profile and admin pages
// are deliberately excluded: they must never show stale data as if it were editable.
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
] as const;

export const PAGE_NETWORK_TIMEOUT_SECONDS = NETWORK_TIMEOUT_SECONDS;

export const isCacheablePath = (pathname: string): boolean =>
  (CACHEABLE_PATHS as ReadonlyArray<string>).includes(pathname);

export const isPublicAsset = (pathname: string): boolean => PUBLIC_ASSET.test(pathname);

const isFreshResponse = (response: Response): boolean =>
  response.ok && response.type !== "opaqueredirect" && !response.redirected;

const isHtml = (response: Response): boolean => (response.headers.get("content-type") ?? "").includes("text/html");

// Redirects and error pages are never saved, only real pages
export const isStorableHtml = (response: Response): boolean => isFreshResponse(response) && isHtml(response);

const isValidWeek = (week: unknown): week is number =>
  Number.isInteger(week) && Number(week) >= 1 && Number(week) <= 18;

export const warmUrls = (week: unknown): Array<string> =>
  CACHEABLE_PATHS.map((path) => (isValidWeek(week) ? `${path}?week=${week}` : path));

// Team logos and other optimized images a saved page needs, so they show offline even if never scrolled into view
export const extractImageUrls = (html: string): Array<string> => {
  const matches = html.replaceAll("\\u0026", "&").match(IMAGE_URL_IN_HTML) ?? [];

  return [...new Set(matches.map((match) => match.replaceAll("&amp;", "&")))].slice(0, MAX_WARMED_IMAGES);
};

// A saved copy of the same page for another week beats nothing, and the page itself says which week it is
export const findNewestSibling = async (cache: Cache, requestUrl: string): Promise<Response | undefined> => {
  const { pathname } = new URL(requestUrl);
  const keys = await cache.keys();
  const sibling = keys.filter((key) => new URL(key.url).pathname === pathname).pop();

  return sibling ? cache.match(sibling, { ignoreVary: true }) : undefined;
};

export const trimToNewest = async (cache: Cache, max = MAX_SAVED_PAGES): Promise<void> => {
  const keys = await cache.keys();

  await Promise.all(keys.slice(0, Math.max(keys.length - max, 0)).map((key) => cache.delete(key)));
};

// Same-origin only, so a notification payload can never send the user to another site
export const resolveTargetUrl = (url: string | undefined, origin: string): string => {
  try {
    const target = new URL(url || "/", origin);

    return target.origin === origin ? target.href : origin;
  } catch {
    return origin;
  }
};

export const canBadge = (count: unknown, hasBadgeApi: boolean): count is number =>
  hasBadgeApi && typeof count === "number";
