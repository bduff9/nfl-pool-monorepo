import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockDb: MockDb;

const getGamesForWeek = vi.fn();
const getAllRegisteredUsers = vi.fn();
const getUserPicksForWeek = vi.fn();
const findFutureGame = vi.fn();
const getTeamsFromDB = vi.fn();
const updateTeamByeWeeks = vi.fn();
const sendInvalidGamesEmail = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("@nfl-pool-monorepo/db/src/queries/game", () => ({ findFutureGame, getGamesForWeek }));
vi.mock("@nfl-pool-monorepo/db/src/queries/user", () => ({ getAllRegisteredUsers }));
vi.mock("@nfl-pool-monorepo/db/src/queries/pick", () => ({ getUserPicksForWeek }));
vi.mock("@nfl-pool-monorepo/db/src/queries/team", () => ({ getTeamsFromDB }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/team", () => ({ updateTeamByeWeeks }));
vi.mock("@nfl-pool-monorepo/transactional/emails/invalidGames", () => ({ sendInvalidGamesEmail }));

describe("healPicks", () => {
  beforeEach(() => {
    mockDb = createMockDb();
    mockDb.executeTakeFirstOrThrow.mockResolvedValue({ numUpdatedRows: 1n });
    getGamesForWeek.mockReset();
    getAllRegisteredUsers.mockReset();
    getUserPicksForWeek.mockReset();
    vi.resetModules();
  });

  it("makes no updates when every pick is already within range", async () => {
    getGamesForWeek.mockResolvedValueOnce(new Array(3).fill(null));
    getAllRegisteredUsers.mockResolvedValueOnce([{ UserID: 1, UserLeagues: [{ LeagueID: 100 }] }]);
    getUserPicksForWeek.mockResolvedValueOnce([
      { PickID: 1, PickPoints: 1 },
      { PickID: 2, PickPoints: 2 },
      { PickID: 3, PickPoints: 3 },
    ]);

    const { healPicks } = await import("./healing");
    await healPicks(1);

    expect(mockDb.executeTakeFirstOrThrow).not.toHaveBeenCalled();
  });

  it("moves an over-the-max pick down to the next open slot", async () => {
    getGamesForWeek.mockResolvedValueOnce(new Array(2).fill(null));
    getAllRegisteredUsers.mockResolvedValueOnce([{ UserID: 1, UserLeagues: [{ LeagueID: 100 }] }]);
    getUserPicksForWeek.mockResolvedValueOnce([
      { PickID: 1, PickPoints: 1 },
      { PickID: 2, PickPoints: 3 },
    ]);

    const { healPicks } = await import("./healing");
    await healPicks(1);

    expect(mockDb.executeTakeFirstOrThrow).toHaveBeenCalledTimes(1);
    expect(mockDb.where).toHaveBeenCalledWith("PickID", "=", 2);
    expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ PickPoints: 2 }));
  });

  it("cascades the move down when the target slot is already occupied", async () => {
    getGamesForWeek.mockResolvedValueOnce(new Array(2).fill(null));
    getAllRegisteredUsers.mockResolvedValueOnce([{ UserID: 1, UserLeagues: [{ LeagueID: 100 }] }]);
    getUserPicksForWeek.mockResolvedValueOnce([
      { PickID: 1, PickPoints: 2 },
      { PickID: 2, PickPoints: 3 },
    ]);

    const { healPicks } = await import("./healing");
    await healPicks(1);

    expect(mockDb.executeTakeFirstOrThrow).toHaveBeenCalledTimes(2);
    expect(mockDb.where).toHaveBeenNthCalledWith(1, "PickID", "=", 1);
    expect(mockDb.set).toHaveBeenNthCalledWith(1, expect.objectContaining({ PickPoints: 1 }));
    expect(mockDb.where).toHaveBeenNthCalledWith(2, "PickID", "=", 2);
    expect(mockDb.set).toHaveBeenNthCalledWith(2, expect.objectContaining({ PickPoints: 2 }));
  });

  it("moves a below-the-min pick up to the next open slot", async () => {
    getGamesForWeek.mockResolvedValueOnce(new Array(3).fill(null));
    getAllRegisteredUsers.mockResolvedValueOnce([{ UserID: 1, UserLeagues: [{ LeagueID: 100 }] }]);
    getUserPicksForWeek.mockResolvedValueOnce([
      { PickID: 1, PickPoints: 0 },
      { PickID: 2, PickPoints: 2 },
    ]);

    const { healPicks } = await import("./healing");
    await healPicks(1);

    expect(mockDb.executeTakeFirstOrThrow).toHaveBeenCalledTimes(1);
    expect(mockDb.where).toHaveBeenCalledWith("PickID", "=", 1);
    expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ PickPoints: 1 }));
  });

  it("ignores null picks and processes every league a user plays in", async () => {
    getGamesForWeek.mockResolvedValueOnce(new Array(2).fill(null));
    getAllRegisteredUsers.mockResolvedValueOnce([
      {
        UserID: 1,
        UserLeagues: [{ LeagueID: 100 }, { LeagueID: 200 }],
      },
    ]);
    getUserPicksForWeek
      .mockResolvedValueOnce([
        { PickID: 1, PickPoints: null },
        { PickID: 2, PickPoints: 1 },
      ])
      .mockResolvedValueOnce([
        { PickID: 3, PickPoints: 1 },
        { PickID: 4, PickPoints: 2 },
      ]);

    const { healPicks } = await import("./healing");
    await healPicks(1);

    expect(getUserPicksForWeek).toHaveBeenCalledWith(100, 1, 1);
    expect(getUserPicksForWeek).toHaveBeenCalledWith(200, 1, 1);
    expect(mockDb.executeTakeFirstOrThrow).not.toHaveBeenCalled();
  });
});

describe("healWeek", () => {
  const WEEK = 5;
  const KICKOFF = new Date("2026-10-04T17:00:00.000Z");
  const NEW_KICKOFF = new Date("2026-10-04T20:00:00.000Z");
  const TEAMS = { ARI: 1, ATL: 2, DEN: 3, NYJ: 4 };

  const apiTeam = (id: string, isHome: "0" | "1") => ({
    hasPossession: "0",
    id,
    inRedZone: "0",
    isHome,
    passDefenseRank: 1,
    passOffenseRank: 1,
    rushDefenseRank: 1,
    rushOffenseRank: 1,
    score: 0,
    spread: "0",
  });

  const apiMatchup = (kickoff: Date, homeId: string, visitorId: string) => ({
    gameSecondsRemaining: 3600,
    kickoff,
    team: [apiTeam(homeId, "1"), apiTeam(visitorId, "0")],
  });

  const dbGame = (overrides: Record<string, unknown> = {}) => ({
    GameID: 10,
    GameKickoff: KICKOFF,
    GameNumber: 1,
    GameWeek: WEEK,
    homeTeam: { TeamID: TEAMS.ARI, TeamShortName: "ARI" },
    visitorTeam: { TeamID: TEAMS.ATL, TeamShortName: "ATL" },
    ...overrides,
  });

  beforeEach(() => {
    mockDb = createMockDb();
    mockDb.executeTakeFirstOrThrow.mockResolvedValue({ GameNumber: 1 });
    mockDb.execute.mockResolvedValue([{ GameID: 10, GameNumber: 1 }]);
    getGamesForWeek.mockReset();
    getAllRegisteredUsers.mockReset().mockResolvedValue([]);
    getUserPicksForWeek.mockReset();
    findFutureGame.mockReset();
    getTeamsFromDB.mockReset().mockResolvedValue(TEAMS);
    updateTeamByeWeeks.mockReset().mockResolvedValue(undefined);
    sendInvalidGamesEmail.mockReset().mockResolvedValue(undefined);
    vi.resetModules();
  });

  it("returns early without touching teams or byeweeks when the API has no matchup for the week", async () => {
    getGamesForWeek.mockResolvedValueOnce([]);

    const { healWeek } = await import("./healing");
    await healWeek(WEEK, [{ matchup: undefined, week: WEEK + 1 }] as never);

    expect(getTeamsFromDB).not.toHaveBeenCalled();
    expect(updateTeamByeWeeks).not.toHaveBeenCalled();
  });

  it("does nothing when the API game already matches a DB game with the same kickoff", async () => {
    getGamesForWeek.mockResolvedValueOnce([dbGame()]);

    const { healWeek } = await import("./healing");
    await healWeek(WEEK, [{ matchup: [apiMatchup(KICKOFF, "ARI", "ATL")], week: WEEK }] as never);

    expect(mockDb.set).not.toHaveBeenCalledWith(expect.objectContaining({ GameKickoff: expect.anything() }));
    expect(sendInvalidGamesEmail).not.toHaveBeenCalled();
    expect(updateTeamByeWeeks).toHaveBeenCalledWith(WEEK);
  });

  it("updates the kickoff when a matched game's time has changed", async () => {
    getGamesForWeek.mockResolvedValueOnce([dbGame()]);

    const { healWeek } = await import("./healing");
    await healWeek(WEEK, [{ matchup: [apiMatchup(NEW_KICKOFF, "ARI", "ATL")], week: WEEK }] as never);

    expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ GameKickoff: NEW_KICKOFF }));
    expect(updateTeamByeWeeks).toHaveBeenCalledWith(WEEK);
  });

  it("moves an API game to a matching future DB game when it isn't found in the current week", async () => {
    // First call returns this week's DB games; healWeek's success path re-heals both the
    // future week and this week via nested healPicks() calls, each of which also calls
    // getGamesForWeek — mockResolvedValue (not Once) covers those extra calls too.
    getGamesForWeek.mockResolvedValueOnce([dbGame()]).mockResolvedValue([]);
    findFutureGame.mockResolvedValueOnce({ GameID: 99, GameNumber: 1, GameWeek: WEEK + 3 });

    const { healWeek } = await import("./healing");
    await healWeek(WEEK, [
      { matchup: [apiMatchup(KICKOFF, "ARI", "ATL"), apiMatchup(NEW_KICKOFF, "DEN", "NYJ")], week: WEEK },
    ] as never);

    expect(findFutureGame).toHaveBeenCalledWith(TEAMS.DEN, TEAMS.NYJ, WEEK);
    expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ GameKickoff: NEW_KICKOFF }));
    expect(sendInvalidGamesEmail).not.toHaveBeenCalled();
    expect(updateTeamByeWeeks).toHaveBeenCalledWith(WEEK);
  });

  it("emails invalid games when an unmatched API game has no future game and a leftover DB game has no future API match", async () => {
    getGamesForWeek.mockResolvedValueOnce([
      dbGame(),
      dbGame({
        GameID: 11,
        homeTeam: { TeamID: TEAMS.NYJ, TeamShortName: "NYJ" },
        visitorTeam: { TeamID: TEAMS.DEN, TeamShortName: "DEN" },
      }),
    ]);
    findFutureGame.mockRejectedValueOnce(new Error("no future game found"));

    const { healWeek } = await import("./healing");
    await healWeek(WEEK, [
      { matchup: [apiMatchup(KICKOFF, "ARI", "ATL"), apiMatchup(NEW_KICKOFF, "ARI", "DEN")], week: WEEK },
    ] as never);

    expect(findFutureGame).toHaveBeenCalledWith(TEAMS.ARI, TEAMS.DEN, WEEK);
    expect(sendInvalidGamesEmail).toHaveBeenCalledWith(
      WEEK,
      expect.arrayContaining([expect.objectContaining({ kickoff: NEW_KICKOFF })]),
      expect.arrayContaining([expect.objectContaining({ GameID: 11 })]),
    );
    expect(updateTeamByeWeeks).toHaveBeenCalledWith(WEEK);
  });
});
