import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentWeek = vi.fn();
const checkDBIfUpdatesNeeded = vi.fn();
const getSingleWeekFromApi = vi.fn();
const getDbGameFromApi = vi.fn();
const parseTeamsFromApi = vi.fn();
const getTeamFromDB = vi.fn();
const updateTeamData = vi.fn();
const updateSpreads = vi.fn();
const updateDBGame = vi.fn();
const updateMissedPicks = vi.fn();
const markEmptySurvivorPicksAsDead = vi.fn();
const updateSurvivorMV = vi.fn();
const updateWeeklyMV = vi.fn();
const updateOverallMV = vi.fn();
const updateBestPlacementWeekly = vi.fn();
const updateBestPlacementOverall = vi.fn();
const updateAllPayouts = vi.fn();
const lockLatePaymentUsers = vi.fn();
const sendWeekStartedNotifications = vi.fn();
const sendWeekEndedNotifications = vi.fn();
const sendWeeklyEmails = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/queries/week", () => ({ getCurrentWeek }));
vi.mock("@nfl-pool-monorepo/db/src/queries/game", () => ({ checkDBIfUpdatesNeeded }));
vi.mock("@nfl-pool-monorepo/db/src/queries/team", () => ({ getTeamFromDB }));
vi.mock("@nfl-pool-monorepo/api/src", () => ({ getSingleWeekFromApi }));
vi.mock("@nfl-pool-monorepo/api/src/utils", () => ({ getDbGameFromApi, parseTeamsFromApi }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/team", () => ({ updateTeamData }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/game", () => ({ updateDBGame, updateSpreads }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/pick", () => ({ updateMissedPicks }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/survivorPick", () => ({ markEmptySurvivorPicksAsDead }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/survivorMv", () => ({ updateSurvivorMV }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/weeklyMv", () => ({ updateWeeklyMV }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/overallMv", () => ({ updateOverallMV }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/bestPlacement", () => ({
  updateBestPlacementOverall,
  updateBestPlacementWeekly,
}));
vi.mock("@nfl-pool-monorepo/db/src/mutations/payment", () => ({ lockLatePaymentUsers, updateAllPayouts }));
vi.mock("@nfl-pool-monorepo/transactional/src/alerts", () => ({
  sendWeekEndedNotifications,
  sendWeeklyEmails,
  sendWeekStartedNotifications,
}));

const PAST = new Date(Date.now() - 60 * 60 * 1000);
const FUTURE = new Date(Date.now() + 60 * 60 * 1000);

const makeGame = (overrides: Record<string, unknown> = {}) => ({
  kickoff: PAST,
  status: "INPROGRESS",
  team: [
    { id: "5", isHome: true },
    { id: "9", isHome: false },
  ],
  ...overrides,
});

const resetAllMocks = () => {
  getCurrentWeek.mockReset().mockResolvedValue(5);
  checkDBIfUpdatesNeeded.mockReset().mockResolvedValue(true);
  getSingleWeekFromApi.mockReset().mockResolvedValue([]);
  getDbGameFromApi.mockReset().mockResolvedValue({ GameNumber: 2, GameStatus: "Pregame" });
  parseTeamsFromApi.mockReset().mockReturnValue([{ id: "5" }, { id: "9" }]);
  getTeamFromDB.mockReset().mockResolvedValue({ TeamID: 1 });
  updateTeamData.mockReset().mockResolvedValue(undefined);
  updateSpreads.mockReset().mockResolvedValue(undefined);
  updateDBGame.mockReset().mockResolvedValue({ GameStatus: "InProgress" });
  updateMissedPicks.mockReset().mockResolvedValue(undefined);
  markEmptySurvivorPicksAsDead.mockReset().mockResolvedValue(undefined);
  updateSurvivorMV.mockReset().mockResolvedValue(undefined);
  updateWeeklyMV.mockReset().mockResolvedValue(undefined);
  updateOverallMV.mockReset().mockResolvedValue(undefined);
  updateBestPlacementWeekly.mockReset().mockResolvedValue(undefined);
  updateBestPlacementOverall.mockReset().mockResolvedValue(undefined);
  updateAllPayouts.mockReset().mockResolvedValue(undefined);
  lockLatePaymentUsers.mockReset().mockResolvedValue(undefined);
  sendWeekStartedNotifications.mockReset().mockResolvedValue(undefined);
  sendWeekEndedNotifications.mockReset().mockResolvedValue(undefined);
  sendWeeklyEmails.mockReset().mockResolvedValue(undefined);
  vi.resetModules();
};

describe("liveGameUpdater handler", () => {
  beforeEach(resetAllMocks);

  it("exits early when no DB updates are needed", async () => {
    checkDBIfUpdatesNeeded.mockResolvedValue(false);

    const { handler } = await import("./liveGameUpdater");
    await handler(null as never, null as never, null as never);

    expect(getSingleWeekFromApi).not.toHaveBeenCalled();
  });

  it("exits early when the API returns no games", async () => {
    getSingleWeekFromApi.mockResolvedValue([]);

    const { handler } = await import("./liveGameUpdater");
    await handler(null as never, null as never, null as never);

    expect(getTeamFromDB).not.toHaveBeenCalled();
  });

  it("only updates spreads for games that haven't kicked off yet", async () => {
    getSingleWeekFromApi.mockResolvedValue([makeGame({ kickoff: FUTURE, status: "SCHED" })]);

    const { handler } = await import("./liveGameUpdater");
    await handler(null as never, null as never, null as never);

    expect(updateSpreads).toHaveBeenCalled();
    expect(updateDBGame).not.toHaveBeenCalled();
  });

  it("processes missed picks and sends week-started notifications for the first game moving out of Pregame", async () => {
    getDbGameFromApi.mockResolvedValue({ GameNumber: 1, GameStatus: "Pregame" });
    getSingleWeekFromApi.mockResolvedValue([makeGame()]);

    const { handler } = await import("./liveGameUpdater");
    await handler(null as never, null as never, null as never);

    expect(updateMissedPicks).toHaveBeenCalled();
    expect(sendWeekStartedNotifications).toHaveBeenCalledWith(5);
    expect(markEmptySurvivorPicksAsDead).toHaveBeenCalledWith(5);
  });

  it("recalculates all MVs and best placements when a game transitions to Final", async () => {
    getDbGameFromApi.mockResolvedValue({ GameNumber: 2, GameStatus: "InProgress" });
    updateDBGame.mockResolvedValue({ GameStatus: "Final" });
    getSingleWeekFromApi.mockResolvedValue([makeGame()]);

    const { handler } = await import("./liveGameUpdater");
    await handler(null as never, null as never, null as never);

    expect(updateWeeklyMV).toHaveBeenCalledWith(5);
    expect(updateOverallMV).toHaveBeenCalledWith(5);
    expect(updateBestPlacementWeekly).toHaveBeenCalledWith(5);
    expect(updateBestPlacementOverall).toHaveBeenCalledWith(5);
  });

  it("triggers payouts and week-ended notifications once every game for the week is Final", async () => {
    getDbGameFromApi.mockResolvedValue({ GameNumber: 1, GameStatus: "InProgress" });
    updateDBGame.mockResolvedValue({ GameStatus: "Final" });
    getSingleWeekFromApi.mockResolvedValue([makeGame()]);

    const { handler } = await import("./liveGameUpdater");
    await handler(null as never, null as never, null as never);

    expect(updateAllPayouts).toHaveBeenCalledWith(5);
    expect(sendWeekEndedNotifications).toHaveBeenCalledWith(5);
    expect(sendWeeklyEmails).toHaveBeenCalledWith(5);
    expect(lockLatePaymentUsers).toHaveBeenCalledWith(5);
  });

  it("doesn't trigger payouts while games for the week are still in progress", async () => {
    getDbGameFromApi.mockResolvedValue({ GameNumber: 1, GameStatus: "InProgress" });
    updateDBGame.mockResolvedValue({ GameStatus: "InProgress" });
    getSingleWeekFromApi.mockResolvedValue([makeGame()]);

    const { handler } = await import("./liveGameUpdater");
    await handler(null as never, null as never, null as never);

    expect(updateAllPayouts).not.toHaveBeenCalled();
  });
});
