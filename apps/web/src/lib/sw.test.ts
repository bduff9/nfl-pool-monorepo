import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";

import { beforeEach, describe, expect, it, vi } from "vitest";

const ORIGIN = "https://app.test";
const SW_SOURCE = readFileSync(path.join(__dirname, "../../public/sw.js"), "utf8");

const normalize = (input: Request | string): string =>
  new URL(typeof input === "string" ? input : input.url, ORIGIN).href;

class FakeCache {
  entries = new Map<string, Response>();

  async match(input: Request | string): Promise<Response | undefined> {
    return this.entries.get(normalize(input))?.clone();
  }

  async put(input: Request | string, response: Response): Promise<void> {
    this.entries.set(normalize(input), response);
  }

  async add(input: string): Promise<void> {
    this.entries.set(normalize(input), new Response("<h1>offline</h1>", { headers: { "content-type": "text/html" } }));
  }

  async keys(): Promise<Array<Request>> {
    return [...this.entries.keys()].map((url) => new Request(url));
  }

  async delete(input: Request | string): Promise<boolean> {
    return this.entries.delete(normalize(input));
  }
}

class FakeCacheStorage {
  stores = new Map<string, FakeCache>();

  async open(name: string): Promise<FakeCache> {
    const existing = this.stores.get(name);

    if (existing) {
      return existing;
    }

    const created = new FakeCache();

    this.stores.set(name, created);

    return created;
  }

  async match(input: string): Promise<Response | undefined> {
    for (const store of this.stores.values()) {
      const found = await store.match(input);

      if (found) {
        return found;
      }
    }

    return undefined;
  }

  async keys(): Promise<Array<string>> {
    return [...this.stores.keys()];
  }

  async delete(name: string): Promise<boolean> {
    return this.stores.delete(name);
  }
}

const html = (body = "<p>page</p>"): Response => new Response(body, { headers: { "content-type": "text/html" } });

type Handler = (event: unknown) => void;

type Harness = {
  caches: FakeCacheStorage;
  fetchMock: ReturnType<typeof vi.fn>;
  fire: (type: string, event: Record<string, unknown>) => Promise<Array<unknown>>;
  navigate: (url: string) => Promise<Response | undefined>;
  posted: Array<unknown>;
  badge: ReturnType<typeof vi.fn>;
  clearBadge: ReturnType<typeof vi.fn>;
};

const load = async (search = "?offline=1"): Promise<Harness> => {
  const listeners = new Map<string, Handler>();
  const posted: Array<unknown> = [];
  const caches = new FakeCacheStorage();
  const fetchMock = vi.fn();
  const badge = vi.fn().mockResolvedValue(undefined);
  const clearBadge = vi.fn().mockResolvedValue(undefined);
  const self = {
    addEventListener: (type: string, handler: Handler) => listeners.set(type, handler),
    clients: {
      claim: async () => undefined,
      matchAll: async () => [{ postMessage: (message: unknown) => posted.push(message) }],
    },
    location: { href: `${ORIGIN}/sw.js${search}`, origin: ORIGIN },
    navigator: { clearAppBadge: clearBadge, setAppBadge: badge },
    registration: { showNotification: vi.fn().mockResolvedValue(undefined) },
    skipWaiting: async () => undefined,
  };
  const context = vm.createContext({
    AbortController,
    caches,
    clients: self.clients,
    fetch: fetchMock,
    Headers,
    Promise,
    Request,
    Response,
    self,
    setTimeout,
    URL,
  });

  vm.runInContext(SW_SOURCE, context);

  const fire = async (type: string, event: Record<string, unknown>): Promise<Array<unknown>> => {
    const waits: Array<unknown> = [];

    listeners.get(type)?.({ ...event, waitUntil: (promise: unknown) => waits.push(promise) });
    await Promise.all(waits);

    return waits;
  };

  const navigate = async (url: string): Promise<Response | undefined> => {
    let responded: Promise<Response> | undefined;

    listeners.get("fetch")?.({
      request: { headers: new Headers(), method: "GET", mode: "navigate", url: `${ORIGIN}${url}` },
      respondWith: (promise: Promise<Response>) => {
        responded = promise;
      },
    });

    return responded;
  };

  await fire("install", {});

  return { badge, caches, clearBadge, fetchMock, fire, navigate, posted };
};

describe("service worker page caching", () => {
  let sw: Harness;

  beforeEach(async () => {
    sw = await load();
  });

  it("saves informational pages when they load and serves them when the network fails", async () => {
    sw.fetchMock.mockResolvedValueOnce(html("<p>scoreboard</p>"));

    const online = await sw.navigate("/scoreboard?week=6");

    expect(await online?.text()).toBe("<p>scoreboard</p>");

    sw.fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const offline = await sw.navigate("/scoreboard?week=6");

    expect(await offline?.text()).toBe("<p>scoreboard</p>");
  });

  it("falls back to the newest saved copy of the page when that week was never saved", async () => {
    sw.fetchMock.mockResolvedValueOnce(html("<p>week 5</p>"));
    await sw.navigate("/weekly?week=5");
    sw.fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const offline = await sw.navigate("/weekly?week=6");

    expect(await offline?.text()).toBe("<p>week 5</p>");
  });

  it("never saves or serves pages that are not on the allowlist", async () => {
    sw.fetchMock.mockResolvedValueOnce(html("<p>make picks</p>"));
    await sw.navigate("/picks/set?week=6");
    sw.fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const offline = await sw.navigate("/picks/set?week=6");

    expect(await offline?.text()).toBe("<h1>offline</h1>");
  });

  it("does not save redirects or non-HTML responses", async () => {
    const redirected = html("<p>login</p>");

    Object.defineProperty(redirected, "redirected", { value: true });
    sw.fetchMock.mockResolvedValueOnce(redirected);
    await sw.navigate("/scoreboard");
    sw.fetchMock.mockResolvedValueOnce(new Response("{}", { headers: { "content-type": "application/json" } }));
    await sw.navigate("/support");
    sw.fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    expect(await (await sw.navigate("/scoreboard"))?.text()).toBe("<h1>offline</h1>");
    expect(await (await sw.navigate("/support"))?.text()).toBe("<h1>offline</h1>");
  });

  it("only handles navigations and static assets", async () => {
    const responded = vi.fn();
    const sw2 = await load();

    sw2.fetchMock.mockResolvedValue(html());
    await sw2.fire("fetch", {
      request: {
        headers: new Headers({ RSC: "1" }),
        method: "GET",
        mode: "cors",
        url: `${ORIGIN}/scoreboard?_rsc=abc`,
      },
      respondWith: responded,
    });
    await sw2.fire("fetch", {
      request: { headers: new Headers(), method: "POST", mode: "cors", url: `${ORIGIN}/scoreboard` },
      respondWith: responded,
    });

    expect(responded).not.toHaveBeenCalled();
  });

  it("is inert unless registered with the offline flag", async () => {
    const inert = await load("");

    expect(await inert.navigate("/scoreboard")).toBeUndefined();
  });
});

describe("service worker asset caching", () => {
  it("serves hashed build assets from the cache once saved", async () => {
    const sw = await load();
    let responded: Promise<Response> | undefined;
    const request = {
      headers: new Headers(),
      method: "GET",
      mode: "no-cors",
      url: `${ORIGIN}/_next/static/chunks/a.js`,
    };
    const fire = async () => {
      await sw.fire("fetch", {
        request,
        respondWith: (promise: Promise<Response>) => {
          responded = promise;
        },
      });

      return responded;
    };

    sw.fetchMock.mockResolvedValueOnce(new Response("chunk", { headers: { "content-type": "text/javascript" } }));
    expect(await (await fire())?.text()).toBe("chunk");

    sw.fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await (await fire())?.text()).toBe("chunk");
  });
});

describe("service worker cache warming", () => {
  it("saves each informational page and the assets it references, then reports back", async () => {
    const sw = await load();
    const page = html(
      '<script src="/_next/static/chunks/app.js"></script><img src="/_next/image?url=%2Flogo.png&amp;w=64&amp;q=75"><script>"/_next/image?url=%2Fb.png\\u0026w=32\\u0026q=75"</script>',
    );

    sw.fetchMock.mockImplementation(async (input: Request | string) => {
      const url = normalize(input);

      if (url.includes("/_next/")) {
        return new Response("asset");
      }

      return url.includes("/support") ? page : html("<p>page</p>");
    });

    await sw.fire("message", { data: { type: "WARM_CACHE", week: 6 } });

    const fetched = sw.fetchMock.mock.calls.map(([input]) => normalize(input as Request | string));

    expect(fetched).toContain(`${ORIGIN}/scoreboard?week=6`);
    expect(fetched).toContain(`${ORIGIN}/_next/static/chunks/app.js`);
    expect(fetched).toContain(`${ORIGIN}/_next/image?url=%2Flogo.png&w=64&q=75`);
    expect(fetched).toContain(`${ORIGIN}/_next/image?url=%2Fb.png&w=32&q=75`);
    expect(fetched.some((url) => url.includes("/picks/set"))).toBe(false);
    expect(sw.posted).toEqual([expect.objectContaining({ type: "CACHE_WARMED" })]);
  });

  it("ignores an invalid week and skips pages that redirect", async () => {
    const sw = await load();
    const redirect = html();

    Object.defineProperty(redirect, "type", { value: "opaqueredirect" });
    sw.fetchMock.mockResolvedValue(redirect);
    await sw.fire("message", { data: { type: "WARM_CACHE", week: "6; drop" } });

    const fetched = sw.fetchMock.mock.calls.map(([input]) => normalize(input as Request | string));

    expect(fetched).toContain(`${ORIGIN}/scoreboard`);
    expect(fetched.every((url) => !url.includes("drop"))).toBe(true);
    expect((await sw.caches.open("nfl-pages-v1")).entries.size).toBe(0);
  });
});

describe("service worker push", () => {
  it("shows the notification and applies the badge count when one is sent", async () => {
    const sw = await load();

    await sw.fire("push", { data: { json: () => ({ badge: 2, body: "b", title: "t", url: "/picks/set" }) } });
    expect(sw.badge).toHaveBeenCalledWith(2);

    await sw.fire("push", { data: { json: () => ({ badge: 0, body: "b", title: "t" }) } });
    expect(sw.clearBadge).toHaveBeenCalled();
  });

  it("leaves the badge alone when no count is sent", async () => {
    const sw = await load();

    await sw.fire("push", { data: { json: () => ({ body: "b", title: "t" }) } });

    expect(sw.badge).not.toHaveBeenCalled();
    expect(sw.clearBadge).not.toHaveBeenCalled();
  });
});
