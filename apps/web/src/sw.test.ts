import { beforeEach, describe, expect, it, vi } from "vitest";

const ORIGIN = "https://app.test";

type Listener = (event: Record<string, unknown>) => void;

const serwistInstances: Array<{ addEventListeners: ReturnType<typeof vi.fn> }> = [];

vi.mock("serwist", () => {
  class Serwist {
    addEventListeners = vi.fn();

    constructor() {
      serwistInstances.push(this);
    }
  }
  class Strategy {}

  return {
    CacheFirst: Strategy,
    ExpirationPlugin: Strategy,
    NetworkFirst: Strategy,
    NetworkOnly: Strategy,
    Serwist,
    StaleWhileRevalidate: Strategy,
  };
});

class FakeCache {
  entries = new Map<string, Response>();

  async delete(request: Request | string): Promise<boolean> {
    return this.entries.delete(typeof request === "string" ? request : request.url);
  }

  async keys(): Promise<Array<Request>> {
    return [...this.entries.keys()].map((url) => new Request(new URL(url, ORIGIN)));
  }

  async match(request: Request | string): Promise<Response | undefined> {
    return this.entries.get(typeof request === "string" ? request : request.url)?.clone();
  }

  async put(request: Request | string, response: Response): Promise<void> {
    this.entries.set(typeof request === "string" ? new URL(request, ORIGIN).href : request.url, response);
  }
}

type Harness = {
  badge: ReturnType<typeof vi.fn>;
  clearBadge: ReturnType<typeof vi.fn>;
  fetchMock: ReturnType<typeof vi.fn>;
  fire: (type: string, event: Record<string, unknown>) => Promise<void>;
  openWindow: ReturnType<typeof vi.fn>;
  posted: Array<unknown>;
  openWindowClient: Record<string, unknown>;
  setWindows: (windows: Array<Record<string, unknown>>) => void;
  showNotification: ReturnType<typeof vi.fn>;
  skipWaiting: ReturnType<typeof vi.fn>;
};

const load = async (search = ""): Promise<Harness> => {
  vi.resetModules();
  serwistInstances.length = 0;

  const listeners = new Map<string, Listener>();
  const posted: Array<unknown> = [];
  const stores = new Map<string, FakeCache>();
  let windows: Array<Record<string, unknown>> = [];
  const fetchMock = vi.fn();
  const skipWaiting = vi.fn();
  const openWindow = vi.fn();
  const showNotification = vi.fn().mockResolvedValue(undefined);
  const badge = vi.fn().mockResolvedValue(undefined);
  const clearBadge = vi.fn().mockResolvedValue(undefined);

  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("self", {
    addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
    caches: {
      open: async (name: string) => {
        const store = stores.get(name) ?? new FakeCache();

        stores.set(name, store);

        return store;
      },
    },
    clients: {
      matchAll: async () => windows,
      openWindow,
    },
    location: { href: `${ORIGIN}/serwist/sw.js${search}`, origin: ORIGIN },
    navigator: { clearAppBadge: clearBadge, setAppBadge: badge },
    registration: { showNotification },
    skipWaiting,
  });

  await import("./sw");

  const fire = async (type: string, event: Record<string, unknown>): Promise<void> => {
    const waits: Array<unknown> = [];

    listeners.get(type)?.({ ...event, waitUntil: (promise: unknown) => waits.push(promise) });
    await Promise.all(waits);
  };

  return {
    badge,
    clearBadge,
    fetchMock,
    fire,
    openWindow,
    openWindowClient: { postMessage: (message: unknown) => posted.push(message), url: `${ORIGIN}/` },
    posted,
    setWindows: (next) => {
      windows = next;
    },
    showNotification,
    skipWaiting,
  };
};

const html = (body = "<p>page</p>"): Response => new Response(body, { headers: { "content-type": "text/html" } });

describe("service worker setup", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("only handles fetches when registered with the offline flag", async () => {
    await load("");
    expect(serwistInstances[0]?.addEventListeners).not.toHaveBeenCalled();

    await load("?offline=1");
    expect(serwistInstances[0]?.addEventListeners).toHaveBeenCalledOnce();
  });
});

describe("service worker messages", () => {
  it("takes over when one of our own pages asks it to", async () => {
    const sw = await load();

    await sw.fire("message", { data: { type: "SKIP_WAITING" }, origin: ORIGIN });

    expect(sw.skipWaiting).toHaveBeenCalledOnce();
  });

  it("ignores messages from other origins", async () => {
    const sw = await load("?offline=1");

    await sw.fire("message", { data: { type: "SKIP_WAITING" }, origin: "https://evil.example" });
    await sw.fire("message", { data: { type: "WARM_CACHE", week: 6 }, origin: "https://evil.example" });

    expect(sw.skipWaiting).not.toHaveBeenCalled();
    expect(sw.fetchMock).not.toHaveBeenCalled();
  });

  it("does not save pages unless offline support is on", async () => {
    const sw = await load("");

    await sw.fire("message", { data: { type: "WARM_CACHE", week: 6 }, origin: ORIGIN });

    expect(sw.fetchMock).not.toHaveBeenCalled();
  });

  it("saves every informational page and its images, then reports back", async () => {
    const sw = await load("?offline=1");

    sw.setWindows([sw.openWindowClient]);
    sw.fetchMock.mockImplementation(async (input: string) =>
      String(input).includes("/_next/image")
        ? new Response("img")
        : html('<img src="/_next/image?url=%2Fa.png&amp;w=64&amp;q=75">'),
    );

    await sw.fire("message", { data: { type: "WARM_CACHE", week: 6 }, origin: ORIGIN });

    const fetched = sw.fetchMock.mock.calls.map(([input]) => String(input));

    expect(fetched).toContain("/scoreboard?week=6");
    expect(fetched).toContain("/_next/image?url=%2Fa.png&w=64&q=75");
    expect(fetched.some((url) => url.includes("/picks/set"))).toBe(false);
    expect(sw.posted).toEqual([expect.objectContaining({ type: "CACHE_WARMED" })]);
  });
});

describe("service worker push", () => {
  it("shows the notification with its destination and applies the badge", async () => {
    const sw = await load();

    await sw.fire("push", { data: { json: () => ({ badge: 2, body: "b", title: "t", url: "/picks/set?week=3" }) } });

    expect(sw.showNotification).toHaveBeenCalledWith(
      "t",
      expect.objectContaining({ body: "b", data: expect.objectContaining({ url: "/picks/set?week=3" }) }),
    );
    expect(sw.badge).toHaveBeenCalledWith(2);
  });

  it("clears the badge for a zero count and leaves it alone when none is sent", async () => {
    const sw = await load();

    await sw.fire("push", { data: { json: () => ({ badge: 0, body: "b", title: "t" }) } });
    expect(sw.clearBadge).toHaveBeenCalledOnce();

    await sw.fire("push", { data: { json: () => ({ body: "b", title: "t" }) } });
    expect(sw.badge).not.toHaveBeenCalled();
  });

  it("still shows a notification when the payload is missing or unreadable, so iOS keeps the subscription", async () => {
    const sw = await load();

    await sw.fire("push", { data: null });
    await sw.fire("push", {
      data: {
        json: () => {
          throw new Error("bad json");
        },
      },
    });

    expect(sw.showNotification).toHaveBeenCalledTimes(2);
    expect(sw.showNotification).toHaveBeenCalledWith("NFL Confidence Pool", expect.any(Object));
  });
});

describe("service worker notification taps", () => {
  const tap = (url: string | undefined): Record<string, unknown> => ({
    notification: { close: vi.fn(), data: { url } },
  });

  it("opens the destination when the app is not open", async () => {
    const sw = await load();

    await sw.fire("notificationclick", tap("/picks/set?week=6"));

    expect(sw.openWindow).toHaveBeenCalledWith(`${ORIGIN}/picks/set?week=6`);
  });

  it("focuses and navigates the open app instead of opening another window", async () => {
    const sw = await load();
    const navigate = vi.fn().mockResolvedValue(undefined);
    const client = { focus: vi.fn(), navigate, url: `${ORIGIN}/` };

    client.focus.mockResolvedValue(client);
    sw.setWindows([client]);

    await sw.fire("notificationclick", tap("/scoreboard"));

    expect(client.focus).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(`${ORIGIN}/scoreboard`);
    expect(sw.openWindow).not.toHaveBeenCalled();
  });

  it("opens the destination directly when the open window cannot be navigated", async () => {
    const sw = await load();
    const client = {
      focus: vi.fn(),
      navigate: vi.fn().mockRejectedValue(new Error("uncontrolled")),
      url: `${ORIGIN}/`,
    };

    client.focus.mockResolvedValue(client);
    sw.setWindows([client]);

    await sw.fire("notificationclick", tap("/weekly?week=2"));

    expect(sw.openWindow).toHaveBeenCalledWith(`${ORIGIN}/weekly?week=2`);
  });

  it("never sends the user to another site", async () => {
    const sw = await load();

    await sw.fire("notificationclick", tap("https://evil.example/x"));

    expect(sw.openWindow).toHaveBeenCalledWith(ORIGIN);
  });
});
