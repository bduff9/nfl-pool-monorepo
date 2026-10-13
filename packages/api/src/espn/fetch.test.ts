import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchEspnLiveGames, fetchEspnSummary } from "./fetch";
import scoreboardFixture from "./fixtures/espnScoreboard.json";

const respond = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status });

describe("espn fetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests the scoreboard with a timeout and parses it", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respond(scoreboardFixture));

    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchEspnLiveGames()).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("requests the summary for one event", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respond({ scoringPlays: [] }));

    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchEspnSummary("401872994")).toEqual({ lastPlayAt: null, scoringPlays: [] });
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=401872994",
    );
  });

  it("throws on a non-OK response so callers can treat it as a transient failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respond({}, 503)));

    await expect(fetchEspnLiveGames()).rejects.toThrow("503");
  });
});
