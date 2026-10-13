import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockDb, type MockDb } from "../test-utils/mockDb";

let mockDb: MockDb;

vi.mock("../kysely", () => ({
  get db() {
    return mockDb;
  },
}));

const NOW = new Date("2026-10-13T02:50:00Z");

describe("live alert queries", () => {
  beforeEach(() => {
    mockDb = createMockDb();
    vi.resetModules();
  });

  it("looks for games that kicked off within the last six hours", async () => {
    mockDb.execute.mockResolvedValueOnce([{ GameID: 1 }]);

    const { getLiveAlertGames } = await import("./liveAlerts");

    expect(await getLiveAlertGames(NOW)).toEqual([{ GameID: 1 }]);
    expect(mockDb.where).toHaveBeenCalledWith("g.GameKickoff", "<=", NOW);
    expect(mockDb.where).toHaveBeenCalledWith("g.GameKickoff", ">=", new Date("2026-10-12T20:50:00Z"));
  });

  it("reads the week's games, picks and alive survivor picks", async () => {
    mockDb.execute.mockResolvedValue([]);

    const { getAliveSurvivorPicks, getWeekProjectionGames, getWeekProjectionPicks } = await import("./liveAlerts");

    await getWeekProjectionGames(5);
    await getWeekProjectionPicks(5);
    await getAliveSurvivorPicks(5);

    expect(mockDb.where).toHaveBeenCalledWith("GameWeek", "=", 5);
    expect(mockDb.where).toHaveBeenCalledWith("g.GameWeek", "=", 5);
    expect(mockDb.where).toHaveBeenCalledWith("sp.SurvivorPickWeek", "=", 5);
    expect(mockDb.where).toHaveBeenCalledWith("smv.IsAliveOverall", "=", 1);
  });

  it("returns the ids of users who have live alerts on and are reachable", async () => {
    mockDb.execute.mockResolvedValueOnce([{ UserID: 4 }, { UserID: 9 }]);

    const { getLiveAlertSubscriberIds } = await import("./liveAlerts");

    expect(await getLiveAlertSubscriberIds()).toEqual([4, 9]);
    expect(mockDb.where).toHaveBeenCalledWith("n.NotificationType", "=", "LiveGameAlerts");
    expect(mockDb.where).toHaveBeenCalledWith("n.NotificationPushNotification", "=", 1);
    expect(mockDb.where).toHaveBeenCalledWith("u.UserCommunicationsOptedOut", "=", 0);
  });
});
