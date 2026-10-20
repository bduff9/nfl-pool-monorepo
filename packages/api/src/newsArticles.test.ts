import { beforeEach, describe, expect, it, vi } from "vitest";

const { executeTakeFirstOrThrow, fetchWithRetry } = vi.hoisted(() => ({
  executeTakeFirstOrThrow: vi.fn(),
  fetchWithRetry: vi.fn(),
}));

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => {
  const chain = { executeTakeFirstOrThrow, select: () => chain, selectFrom: () => chain, where: () => chain };

  return { db: chain };
});
vi.mock("./fetchWithRetry", () => ({ fetchWithRetry }));

import { getArticlesForWeek } from "./newsArticles";

const KICKOFF = new Date("2026-10-15T00:20:00.000Z");

type FeedArticle = {
  headline: string;
  href?: string;
  images?: { url: string }[];
  published?: string;
  type?: string;
};

const feedArticle = ({
  headline,
  href = `https://www.espn.com/nfl/story/_/id/${headline}`,
  images = [{ url: `https://img.test/${headline}.jpg` }],
  published = "2026-10-20T10:00:00Z",
  type = "Story",
}: FeedArticle) => ({
  description: `About ${headline}`,
  headline,
  images,
  links: { web: { href } },
  published,
  type,
});

const jsonResponse = (body: unknown, ok = true, status = 200) => ({ json: async () => body, ok, status });

type Scores = { filler?: number; major?: number; upset?: number };

// Answers the ESPN feed request with the given articles, and each Jev request with the scores for its headline
const mockFeedAndScores = (articles: ReturnType<typeof feedArticle>[], scores: Record<string, Scores>) => {
  fetchWithRetry.mockImplementation(async (url: string, init?: { body: string }) => {
    if (url.includes("espn.com")) {
      return jsonResponse({ articles });
    }

    const state: string = JSON.parse(init?.body ?? "{}").state;
    const headline = state.split("\n")[0] as string;
    const { filler = 0, major = 0, upset = 0 } = scores[headline] ?? {};

    return jsonResponse({
      answers: { isFiller: { noul: filler }, isMajor: { noul: major }, isUpset: { noul: upset } },
    });
  });
};

describe("getArticlesForWeek", () => {
  beforeEach(() => {
    fetchWithRetry.mockReset();
    executeTakeFirstOrThrow.mockReset().mockResolvedValue({ GameKickoff: KICKOFF });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    process.env.TYPESAFE_API_KEY = "test-key";
  });

  it("returns the three highest scoring articles, best first, mapped for the email", async () => {
    mockFeedAndScores(
      ["a", "b", "c", "d", "e"].map((headline) => feedArticle({ headline })),
      { a: { major: 0.2 }, b: { upset: 0.9 }, c: { major: 0.5 }, d: { major: 0.1 }, e: { major: 0.95 } },
    );

    const articles = await getArticlesForWeek(6);

    expect(articles.map((article) => article.title)).toEqual(["b", "e", "c"]);
    expect(articles[0]).toEqual({
      content: "About b",
      publishedAt: new Date("2026-10-20T10:00:00Z"),
      title: "b",
      url: "https://www.espn.com/nfl/story/_/id/b",
      urlToImage: "https://img.test/b.jpg",
    });
  });

  it("discounts articles Jev reads as filler", async () => {
    mockFeedAndScores([feedArticle({ headline: "fantasy" }), feedArticle({ headline: "recap" })], {
      fantasy: { filler: 0.95, major: 0.9 },
      recap: { major: 0.4 },
    });

    const articles = await getArticlesForWeek(6);

    expect(articles.map((article) => article.title)).toEqual(["recap", "fantasy"]);
  });

  it("never scores videos, non-NFL pages, imageless articles, or articles from before the first kickoff", async () => {
    mockFeedAndScores(
      [
        feedArticle({ headline: "keep" }),
        feedArticle({ headline: "video", type: "Media" }),
        feedArticle({ headline: "fantasy", href: "https://www.espn.com/fantasy/football/story/_/id/1" }),
        feedArticle({ headline: "noimage", images: [] }),
        feedArticle({ headline: "old", published: "2026-10-10T10:00:00Z" }),
      ],
      {},
    );

    const articles = await getArticlesForWeek(6);

    expect(articles.map((article) => article.title)).toEqual(["keep"]);
    // One ESPN request plus one Jev request for the single remaining candidate
    expect(fetchWithRetry).toHaveBeenCalledTimes(2);
  });

  it("sends Jev the article text and the API key", async () => {
    mockFeedAndScores([feedArticle({ headline: "a" })], {});

    await getArticlesForWeek(6);

    const [url, init] = fetchWithRetry.mock.calls[1] as [string, { body: string; headers: Record<string, string> }];

    expect(url).toBe("https://api.typesafe.ai/v1/systemone");
    expect(init.headers.Authorization).toBe("Bearer test-key");
    expect(JSON.parse(init.body).state).toBe("a\nAbout a");
  });

  it("returns no articles when ESPN fails", async () => {
    fetchWithRetry.mockResolvedValue(jsonResponse({}, false, 503));

    await expect(getArticlesForWeek(6)).resolves.toEqual([]);
  });

  it("returns no articles when ESPN returns data it cannot parse", async () => {
    fetchWithRetry.mockResolvedValue(jsonResponse({ articles: "nope" }));

    await expect(getArticlesForWeek(6)).resolves.toEqual([]);
  });

  describe("when Jev cannot score articles", () => {
    const feed = [
      feedArticle({ headline: "story", type: "Story" }),
      feedArticle({ headline: "headline", type: "HeadlineNews" }),
      feedArticle({ headline: "recap", type: "Recap" }),
      feedArticle({ headline: "story2", type: "Story" }),
      feedArticle({ headline: "story3", type: "Story" }),
    ];

    it("ranks by article type then ESPN order, and logs that Jev is down", async () => {
      fetchWithRetry.mockImplementation(async (url: string) =>
        url.includes("espn.com") ? jsonResponse({ articles: feed }) : jsonResponse({}, false, 401),
      );

      const articles = await getArticlesForWeek(6);

      expect(articles.map((article) => article.title)).toEqual(["recap", "headline", "story"]);
      expect(console.error).toHaveBeenCalledWith(
        "Jev could not score some articles, using fallback ranking for them",
        expect.objectContaining({ failed: 5, total: 5, week: 6 }),
      );
    });

    it("also falls back when the network request itself fails", async () => {
      fetchWithRetry.mockImplementation(async (url: string) => {
        if (url.includes("espn.com")) {
          return jsonResponse({ articles: feed });
        }

        throw new Error("network down");
      });

      const articles = await getArticlesForWeek(6);

      expect(articles.map((article) => article.title)).toEqual(["recap", "headline", "story"]);
    });

    it("still uses Jev's scores for the articles it did score", async () => {
      fetchWithRetry.mockImplementation(async (url: string, init?: { body: string }) => {
        if (url.includes("espn.com")) {
          return jsonResponse({ articles: feed });
        }

        const headline = (JSON.parse(init?.body ?? "{}").state as string).split("\n")[0];

        if (headline === "story3") {
          return jsonResponse({
            answers: { isFiller: { noul: 0 }, isMajor: { noul: 1 }, isUpset: { noul: 1 } },
          });
        }

        return jsonResponse({}, false, 500);
      });

      const articles = await getArticlesForWeek(6);

      expect(articles.map((article) => article.title)).toEqual(["story3", "recap", "headline"]);
      expect(console.error).toHaveBeenCalledWith(
        "Jev could not score some articles, using fallback ranking for them",
        expect.objectContaining({ failed: 4, total: 5 }),
      );
    });
  });

  it("returns no articles when the week has no first game", async () => {
    executeTakeFirstOrThrow.mockRejectedValue(new Error("no result"));

    await expect(getArticlesForWeek(6)).resolves.toEqual([]);
  });
});
