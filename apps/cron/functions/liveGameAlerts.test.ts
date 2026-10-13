import { beforeEach, describe, expect, it, vi } from "vitest";

const getLiveAlertGames = vi.fn();
const getLiveAlertSubscriberIds = vi.fn();
const getWeekProjectionGames = vi.fn();
const getWeekProjectionPicks = vi.fn();
const getAliveSurvivorPicks = vi.fn();
const fetchEspnLiveGames = vi.fn();
const fetchEspnSummary = vi.fn();
const sendLiveAlerts = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/queries/liveAlerts", () => ({
  getAliveSurvivorPicks,
  getLiveAlertGames,
  getLiveAlertSubscriberIds,
  getWeekProjectionGames,
  getWeekProjectionPicks,
}));
vi.mock("@nfl-pool-monorepo/api/src/espn/fetch", () => ({ fetchEspnLiveGames, fetchEspnSummary }));
vi.mock("@nfl-pool-monorepo/transactional/src/liveAlerts/sendLiveAlerts", () => ({ sendLiveAlerts }));

const NOW = new Date("2026-10-13T02:50:00Z");

const dbGame = {
  GameID: 1,
  GameWeek: 5,
  HomeTeamID: 28,
  HomeTeamName: "Rams",
  HomeTeamShortName: "LAR",
  VisitorTeamID: 4,
  VisitorTeamName: "Bills",
  VisitorTeamShortName: "BUF",
};
const espnGame = {
  away: { espnTeamId: "2", score: 27, shortName: "BUF" },
  eventId: "401872994",
  home: { espnTeamId: "14", score: 20, shortName: "LAR" },
  period: 4,
  state: "in",
};
const summary = {
  lastPlayAt: new Date("2026-10-13T02:45:42Z"),
  scoringPlays: [
    { awayScore: 19, homeScore: 14, id: "a", period: 3, wallclock: new Date("2026-10-13T02:22:51Z") },
    { awayScore: 19, homeScore: 20, id: "b", period: 4, wallclock: new Date("2026-10-13T02:48:00Z") },
  ],
};

const { handler } = await import("./liveGameAlerts");

const run = () => handler(undefined as never, {} as never, () => undefined);

describe("liveGameAlerts handler", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW });
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    getLiveAlertGames.mockReset().mockResolvedValue([dbGame]);
    getLiveAlertSubscriberIds.mockReset().mockResolvedValue([1, 2]);
    getWeekProjectionGames.mockReset().mockResolvedValue([]);
    getWeekProjectionPicks.mockReset().mockResolvedValue([]);
    getAliveSurvivorPicks.mockReset().mockResolvedValue([{ TeamID: 4, UserID: 1 }]);
    fetchEspnLiveGames.mockReset().mockResolvedValue([espnGame]);
    fetchEspnSummary.mockReset().mockResolvedValue(summary);
    sendLiveAlerts.mockReset().mockResolvedValue({ failed: 0, sent: 1, skipped: 0 });
  });

  it("exits before touching ESPN when no game of ours is in progress", async () => {
    getLiveAlertGames.mockResolvedValue([]);

    await run();

    expect(fetchEspnLiveGames).not.toHaveBeenCalled();
    expect(getLiveAlertSubscriberIds).not.toHaveBeenCalled();
    expect(sendLiveAlerts).not.toHaveBeenCalled();
  });

  it("only looks for games that kicked off within the last 6 hours at the current time", async () => {
    await run();

    expect(getLiveAlertGames).toHaveBeenCalledWith(NOW);
  });

  it("logs and returns, without throwing, when ESPN's scoreboard is unavailable", async () => {
    fetchEspnLiveGames.mockRejectedValue(new Error("timeout"));

    await expect(run()).resolves.toBeUndefined();

    expect(fetchEspnSummary).not.toHaveBeenCalled();
    expect(sendLiveAlerts).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it("only fetches summaries for ESPN games that match one of ours", async () => {
    fetchEspnLiveGames.mockResolvedValue([
      espnGame,
      { ...espnGame, away: { ...espnGame.away, shortName: "DAL" }, eventId: "other" },
    ]);

    await run();

    expect(fetchEspnSummary).toHaveBeenCalledTimes(1);
    expect(fetchEspnSummary).toHaveBeenCalledWith("401872994");
  });

  it("skips a game whose summary fails and does not send anything for it", async () => {
    fetchEspnSummary.mockRejectedValue(new Error("503"));

    await expect(run()).resolves.toBeUndefined();

    expect(getLiveAlertSubscriberIds).not.toHaveBeenCalled();
    expect(sendLiveAlerts).not.toHaveBeenCalled();
  });

  it("does no more work when nobody has live game alerts turned on", async () => {
    getLiveAlertSubscriberIds.mockResolvedValue([]);

    await run();

    expect(getWeekProjectionGames).not.toHaveBeenCalled();
    expect(sendLiveAlerts).not.toHaveBeenCalled();
  });

  it("builds this week's alerts for subscribers and sends them", async () => {
    await run();

    expect(getWeekProjectionGames).toHaveBeenCalledWith(5);
    expect(sendLiveAlerts).toHaveBeenCalledTimes(1);
    expect(sendLiveAlerts.mock.calls[0]?.[0]).toEqual([
      expect.objectContaining({
        body: "BUF now trails LAR 20–19 in the 4th. Your survivor pick is in trouble.",
        key: "b",
        type: "survivorBehind",
        userId: 1,
      }),
    ]);
  });
});
