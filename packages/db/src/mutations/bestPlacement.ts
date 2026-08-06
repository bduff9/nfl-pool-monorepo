import { sql } from "kysely";

import { db } from "../kysely";

// --- Types for the in-memory simulator ---

type UndecidedGame = {
  gameID: number;
  gameWeek: number;
  homeTeamID: number;
  visitorTeamID: number;
  gameKickoff: Date;
  gameHomeScore: number;
  gameVisitorScore: number;
};

type UserPick = {
  gameID: number;
  teamID: number | null;
  pickPoints: number | null;
};

type EligibleUser = {
  userID: number;
  tiebreakerLastScore: number;
  basePointsEarned: number;
  baseGamesCorrect: number;
  picks: UserPick[];
};

type WeeklyRankInput = {
  userID: number;
  pointsEarned: number;
  gamesCorrect: number;
  tiebreakerIsUnder: boolean;
  tiebreakerDiffAbsolute: number | null;
};

type OverallRankInput = {
  userID: number;
  pointsEarned: number;
  gamesCorrect: number;
};

type UserBestResult = {
  bestRank: number;
  canAchieveFirst: boolean;
  canAchieveSecond: boolean;
  canAchieveThird: boolean;
};

// --- Pure ranking functions (mirror SQL variable-rank logic) ---

export const rankUsersWeekly = (users: WeeklyRankInput[]): Map<number, number> => {
  const sorted = [...users].sort((a, b) => {
    if (b.pointsEarned !== a.pointsEarned) return b.pointsEarned - a.pointsEarned;
    if (b.gamesCorrect !== a.gamesCorrect) return b.gamesCorrect - a.gamesCorrect;

    if (a.tiebreakerDiffAbsolute !== null && b.tiebreakerDiffAbsolute !== null) {
      if (b.tiebreakerIsUnder !== a.tiebreakerIsUnder)
        return (b.tiebreakerIsUnder ? 1 : 0) - (a.tiebreakerIsUnder ? 1 : 0);
      if (a.tiebreakerDiffAbsolute !== b.tiebreakerDiffAbsolute)
        return a.tiebreakerDiffAbsolute - b.tiebreakerDiffAbsolute;
    }

    return 0;
  });

  const ranks = new Map<number, number>();
  let currentRank = 1;

  for (let i = 0; i < sorted.length; i++) {
    const user = sorted[i];

    if (!user) continue;

    if (i > 0) {
      const prev = sorted[i - 1];

      if (prev) {
        const tied =
          prev.pointsEarned === user.pointsEarned &&
          prev.gamesCorrect === user.gamesCorrect &&
          (prev.tiebreakerDiffAbsolute === null ||
            user.tiebreakerDiffAbsolute === null ||
            (prev.tiebreakerIsUnder === user.tiebreakerIsUnder &&
              prev.tiebreakerDiffAbsolute === user.tiebreakerDiffAbsolute));

        if (!tied) {
          currentRank = i + 1;
        }
      }
    }

    ranks.set(user.userID, currentRank);
  }

  return ranks;
};

export const rankUsersOverall = (users: OverallRankInput[]): Map<number, number> => {
  const sorted = [...users].sort((a, b) => {
    if (b.pointsEarned !== a.pointsEarned) return b.pointsEarned - a.pointsEarned;
    return b.gamesCorrect - a.gamesCorrect;
  });

  const ranks = new Map<number, number>();
  let currentRank = 1;

  for (let i = 0; i < sorted.length; i++) {
    const user = sorted[i];

    if (!user) continue;

    if (i > 0) {
      const prev = sorted[i - 1];

      if (prev) {
        const tied = prev.pointsEarned === user.pointsEarned && prev.gamesCorrect === user.gamesCorrect;

        if (!tied) {
          currentRank = i + 1;
        }
      }
    }

    ranks.set(user.userID, currentRank);
  }

  return ranks;
};

// --- Scenario enumerator (base-3 counter) ---

export const computeBestPlacements = (
  eligibleUsers: EligibleUser[],
  undecidedGames: UndecidedGame[],
  tieTeamID: number,
  lastGameKickoff: Date | null,
): Map<number, UserBestResult> => {
  const K = undecidedGames.length;
  const scenarioCount = 3 ** K;
  const results = new Map<number, UserBestResult>();

  for (const user of eligibleUsers) {
    results.set(user.userID, {
      bestRank: Number.MAX_SAFE_INTEGER,
      canAchieveFirst: false,
      canAchieveSecond: false,
      canAchieveThird: false,
    });
  }

  if (eligibleUsers.length === 0) return results;

  const picksByGameID = new Map<number, Map<number, UserPick>>();

  for (const user of eligibleUsers) {
    for (const pick of user.picks) {
      let gamePicks = picksByGameID.get(pick.gameID);

      if (!gamePicks) {
        gamePicks = new Map();
        picksByGameID.set(pick.gameID, gamePicks);
      }

      gamePicks.set(user.userID, pick);
    }
  }

  const lastGameID =
    lastGameKickoff !== null
      ? undecidedGames.reduce<number | null>(
          (acc, g) => (g.gameKickoff.getTime() === lastGameKickoff.getTime() ? g.gameID : acc),
          null,
        )
      : null;

  for (let scenario = 0; scenario < scenarioCount; scenario++) {
    const outcomes = decodeScenario(scenario, K);

    const weeklyInputs: WeeklyRankInput[] = [];

    for (const user of eligibleUsers) {
      let pointsEarned = user.basePointsEarned;
      let gamesCorrect = user.baseGamesCorrect;
      let lastScore: number | null = null;

      for (let g = 0; g < K; g++) {
        const game = undecidedGames[g];
        const outcome = outcomes[g];

        if (!game || outcome === undefined) continue;

        const winnerID = getWinnerID(game, outcome, tieTeamID);

        const pick = picksByGameID.get(game.gameID)?.get(user.userID);

        if (pick?.teamID != null && pick.teamID === winnerID && pick.pickPoints != null) {
          pointsEarned += pick.pickPoints;
          gamesCorrect += 1;
        }

        if (game.gameID === lastGameID) {
          lastScore = computeScenarioScore(game, outcome);
        }
      }

      let tiebreakerIsUnder = false;
      let tiebreakerDiffAbsolute: number | null = null;

      if (lastScore !== null) {
        tiebreakerIsUnder = user.tiebreakerLastScore <= lastScore;
        tiebreakerDiffAbsolute = Math.abs(user.tiebreakerLastScore - lastScore);
      }

      weeklyInputs.push({
        gamesCorrect,
        pointsEarned,
        tiebreakerDiffAbsolute,
        tiebreakerIsUnder,
        userID: user.userID,
      });
    }

    const ranks = rankUsersWeekly(weeklyInputs);

    for (const [userID, rank] of ranks) {
      const result = results.get(userID);

      if (!result) continue;

      if (rank < result.bestRank) {
        result.bestRank = rank;
      }

      if (rank <= 1) result.canAchieveFirst = true;
      if (rank <= 2) result.canAchieveSecond = true;
      if (rank <= 3) result.canAchieveThird = true;
    }
  }

  return results;
};

const decodeScenario = (scenario: number, k: number): number[] => {
  const outcomes: number[] = new Array(k);
  let remaining = scenario;

  for (let i = k - 1; i >= 0; i--) {
    outcomes[i] = remaining % 3;
    remaining = Math.trunc(remaining / 3);
  }

  return outcomes;
};

const getWinnerID = (game: UndecidedGame, outcome: number, tieTeamID: number): number => {
  if (outcome === 0) return game.homeTeamID;
  if (outcome === 1) return game.visitorTeamID;
  return tieTeamID;
};

const computeScenarioScore = (game: UndecidedGame, outcome: number): number => {
  if (outcome === 0) return game.gameHomeScore + 7 + game.gameVisitorScore;
  if (outcome === 1) return game.gameHomeScore + game.gameVisitorScore + 7;
  return game.gameHomeScore + 3 + game.gameVisitorScore + 3;
};

// --- DB queries for loading data ---

const loadUndecidedGamesForWeek = async (week: number): Promise<UndecidedGame[]> => {
  return db
    .selectFrom("Games")
    .select([
      "GameID as gameID",
      "GameWeek as gameWeek",
      "HomeTeamID as homeTeamID",
      "VisitorTeamID as visitorTeamID",
      "GameKickoff as gameKickoff",
      "GameHomeScore as gameHomeScore",
      "GameVisitorScore as gameVisitorScore",
    ])
    .where("GameWeek", "=", week)
    .where("WinnerTeamID", "is", null)
    .execute();
};

const loadUndecidedGamesUpToWeek = async (week: number): Promise<UndecidedGame[]> => {
  return db
    .selectFrom("Games")
    .select([
      "GameID as gameID",
      "GameWeek as gameWeek",
      "HomeTeamID as homeTeamID",
      "VisitorTeamID as visitorTeamID",
      "GameKickoff as gameKickoff",
      "GameHomeScore as gameHomeScore",
      "GameVisitorScore as gameVisitorScore",
    ])
    .where("GameWeek", "<=", week)
    .where("WinnerTeamID", "is", null)
    .execute();
};

const loadEligibleUsersForWeek = async (week: number): Promise<EligibleUser[]> => {
  const tiebreakers = await db
    .selectFrom("Tiebreakers")
    .select(["UserID", "TiebreakerLastScore"])
    .where("TiebreakerWeek", "=", week)
    .where("TiebreakerHasSubmitted", "=", 1)
    .execute();

  if (tiebreakers.length === 0) return [];

  const userIDs = tiebreakers.map((t) => t.UserID);

  const [allPicks, finalizedPicks] = await Promise.all([
    db
      .selectFrom("Picks as P")
      .innerJoin("Games as G", "G.GameID", "P.GameID")
      .select(["P.UserID", "P.GameID as gameID", "P.TeamID as teamID", "P.PickPoints as pickPoints"])
      .where("G.GameWeek", "=", week)
      .where("P.UserID", "in", userIDs)
      .execute(),
    db
      .selectFrom("Picks as P")
      .innerJoin("Games as G", "G.GameID", "P.GameID")
      .select([
        "P.UserID",
        sql<number>`SUM(CASE WHEN P.TeamID = G.WinnerTeamID THEN P.PickPoints ELSE 0 END)`.as("pointsEarned"),
        sql<number>`SUM(CASE WHEN P.TeamID = G.WinnerTeamID THEN 1 ELSE 0 END)`.as("gamesCorrect"),
      ])
      .where("G.GameWeek", "=", week)
      .where("G.WinnerTeamID", "is not", null)
      .where("P.UserID", "in", userIDs)
      .groupBy("P.UserID")
      .execute(),
  ]);

  const baseStats = new Map(
    finalizedPicks.map((f) => [f.UserID, { gamesCorrect: f.gamesCorrect, pointsEarned: f.pointsEarned }]),
  );
  const picksByUser = new Map<number, UserPick[]>();

  for (const pick of allPicks) {
    let userPicks = picksByUser.get(pick.UserID);

    if (!userPicks) {
      userPicks = [];
      picksByUser.set(pick.UserID, userPicks);
    }

    userPicks.push({ gameID: pick.gameID, pickPoints: pick.pickPoints, teamID: pick.teamID });
  }

  return tiebreakers.map((t) => ({
    baseGamesCorrect: baseStats.get(t.UserID)?.gamesCorrect ?? 0,
    basePointsEarned: baseStats.get(t.UserID)?.pointsEarned ?? 0,
    picks: picksByUser.get(t.UserID) ?? [],
    tiebreakerLastScore: t.TiebreakerLastScore,
    userID: t.UserID,
  }));
};

const loadEligibleUsersOverall = async (
  week: number,
): Promise<{ userID: number; basePointsEarned: number; baseGamesCorrect: number }[]> => {
  const submittedUserIDs = await db
    .selectFrom("Tiebreakers")
    .select("UserID")
    .where("TiebreakerWeek", "<=", week)
    .where("TiebreakerHasSubmitted", "=", 1)
    .groupBy("UserID")
    .execute();

  if (submittedUserIDs.length === 0) return [];

  const userIDs = submittedUserIDs.map((u) => u.UserID);

  const stats = await db
    .selectFrom("Picks as P")
    .innerJoin("Games as G", "G.GameID", "P.GameID")
    .select([
      "P.UserID",
      sql<number>`SUM(CASE WHEN P.TeamID = G.WinnerTeamID THEN P.PickPoints ELSE 0 END)`.as("pointsEarned"),
      sql<number>`SUM(CASE WHEN P.TeamID = G.WinnerTeamID THEN 1 ELSE 0 END)`.as("gamesCorrect"),
    ])
    .where("G.GameWeek", "<=", week)
    .where("G.WinnerTeamID", "is not", null)
    .where("P.UserID", "in", userIDs)
    .groupBy("P.UserID")
    .execute();

  return stats.map((s) => ({
    baseGamesCorrect: s.gamesCorrect,
    basePointsEarned: s.pointsEarned,
    userID: s.UserID,
  }));
};

const loadAllPicksUpToWeek = async (week: number, userIDs: number[]) => {
  if (userIDs.length === 0) return [];

  return db
    .selectFrom("Picks as P")
    .innerJoin("Games as G", "G.GameID", "P.GameID")
    .select(["P.UserID", "P.GameID as gameID", "P.TeamID as teamID", "P.PickPoints as pickPoints"])
    .where("G.GameWeek", "<=", week)
    .where("P.UserID", "in", userIDs)
    .execute();
};

const getLastGameKickoff = async (week: number): Promise<Date | null> => {
  const result = await db
    .selectFrom("Games")
    .select("GameKickoff")
    .where("GameWeek", "=", week)
    .orderBy("GameKickoff", "desc")
    .limit(1)
    .executeTakeFirst();

  return result?.GameKickoff ?? null;
};

const getTieTeamID = async (): Promise<number> => {
  const result = await db
    .selectFrom("Teams")
    .select("TeamID")
    .where("TeamShortName", "=", "TIE")
    .executeTakeFirstOrThrow();
  return result.TeamID;
};

// --- Public API: called from liveGameUpdater ---

export const updateBestPlacementWeekly = async (week: number): Promise<void> => {
  const startTime = Date.now();
  const [undecidedGames, eligibleUsers] = await Promise.all([
    loadUndecidedGamesForWeek(week),
    loadEligibleUsersForWeek(week),
  ]);

  if (eligibleUsers.length === 0) {
    console.log(`Best placement weekly: no eligible users for week ${week}`);
    return;
  }

  const K = undecidedGames.length;
  const scenarioCount = 3 ** K;

  let results: Map<number, UserBestResult>;

  if (K === 0) {
    const currentRanks = await db.selectFrom("WeeklyMV").select(["UserID", "Rank"]).where("Week", "=", week).execute();
    const rankByUserID = new Map(currentRanks.map((r) => [r.UserID, r.Rank]));

    results = new Map();

    for (const user of eligibleUsers) {
      const rank = rankByUserID.get(user.userID) ?? Number.MAX_SAFE_INTEGER;

      results.set(user.userID, {
        bestRank: rank,
        canAchieveFirst: rank <= 1,
        canAchieveSecond: rank <= 2,
        canAchieveThird: rank <= 3,
      });
    }
  } else {
    const [tieTeamID, lastGameKickoff] = await Promise.all([getTieTeamID(), getLastGameKickoff(week)]);

    results = computeBestPlacements(eligibleUsers, undecidedGames, tieTeamID, lastGameKickoff);
  }

  const values = [...results.entries()].map(([userID, r]) => ({
    BestRank: r.bestRank === Number.MAX_SAFE_INTEGER ? null : r.bestRank,
    CanAchieveFirst: r.canAchieveFirst ? 1 : 0,
    CanAchieveSecond: r.canAchieveSecond ? 1 : 0,
    ScenarioCount: scenarioCount,
    UndecidedGamesAtCalc: K,
    UserID: userID,
    Week: week,
  }));

  if (values.length > 0) {
    await db.transaction().execute(async (trx) => {
      await trx.deleteFrom("BestPlacementWeekly").where("Week", "=", week).execute();
      await trx.insertInto("BestPlacementWeekly").values(values).execute();
    });
  }

  const duration = Date.now() - startTime;

  console.log(
    `Best placement weekly: week=${week}, users=${eligibleUsers.length}, K=${K}, scenarios=${scenarioCount}, duration=${duration}ms`,
  );
};

export const updateBestPlacementOverall = async (week: number): Promise<void> => {
  const startTime = Date.now();
  const [undecidedGames, overallUsers] = await Promise.all([
    loadUndecidedGamesUpToWeek(week),
    loadEligibleUsersOverall(week),
  ]);

  if (overallUsers.length === 0) {
    console.log(`Best placement overall: no eligible users up to week ${week}`);
    return;
  }

  const K = undecidedGames.length;
  const scenarioCount = 3 ** K;

  let overallResults: Map<number, UserBestResult>;

  if (K === 0) {
    const currentRanks = await db.selectFrom("OverallMV").select(["UserID", "Rank"]).execute();
    const rankByUserID = new Map(currentRanks.map((r) => [r.UserID, r.Rank]));

    overallResults = new Map();

    for (const user of overallUsers) {
      const rank = rankByUserID.get(user.userID) ?? Number.MAX_SAFE_INTEGER;

      overallResults.set(user.userID, {
        bestRank: rank,
        canAchieveFirst: rank <= 1,
        canAchieveSecond: rank <= 2,
        canAchieveThird: rank <= 3,
      });
    }
  } else {
    const userIDs = overallUsers.map((u) => u.userID);
    const [tieTeamID, allPicks] = await Promise.all([getTieTeamID(), loadAllPicksUpToWeek(week, userIDs)]);

    const picksByUser = new Map<number, UserPick[]>();

    for (const pick of allPicks) {
      let userPicks = picksByUser.get(pick.UserID);

      if (!userPicks) {
        userPicks = [];
        picksByUser.set(pick.UserID, userPicks);
      }

      userPicks.push({ gameID: pick.gameID, pickPoints: pick.pickPoints, teamID: pick.teamID });
    }

    const overallEligible: EligibleUser[] = overallUsers.map((u) => ({
      baseGamesCorrect: u.baseGamesCorrect,
      basePointsEarned: u.basePointsEarned,
      picks: picksByUser.get(u.userID) ?? [],
      tiebreakerLastScore: 0,
      userID: u.userID,
    }));

    const rawResults = computeBestPlacementsOverall(overallEligible, undecidedGames, tieTeamID);

    overallResults = rawResults;
  }

  const values = [...overallResults.entries()].map(([userID, r]) => ({
    BestRank: r.bestRank === Number.MAX_SAFE_INTEGER ? null : r.bestRank,
    CanAchieveFirst: r.canAchieveFirst ? 1 : 0,
    CanAchieveSecond: r.canAchieveSecond ? 1 : 0,
    CanAchieveThird: r.canAchieveThird ? 1 : 0,
    ScenarioCount: scenarioCount,
    UndecidedGamesAtCalc: K,
    UserID: userID,
  }));

  if (values.length > 0) {
    await db.transaction().execute(async (trx) => {
      await trx.deleteFrom("BestPlacementOverall").execute();
      await trx.insertInto("BestPlacementOverall").values(values).execute();
    });
  }

  const duration = Date.now() - startTime;

  console.log(
    `Best placement overall: week=${week}, users=${overallUsers.length}, K=${K}, scenarios=${scenarioCount}, duration=${duration}ms`,
  );
};

export const computeBestPlacementsOverall = (
  eligibleUsers: EligibleUser[],
  undecidedGames: UndecidedGame[],
  tieTeamID: number,
): Map<number, UserBestResult> => {
  const K = undecidedGames.length;
  const scenarioCount = 3 ** K;
  const results = new Map<number, UserBestResult>();

  for (const user of eligibleUsers) {
    results.set(user.userID, {
      bestRank: Number.MAX_SAFE_INTEGER,
      canAchieveFirst: false,
      canAchieveSecond: false,
      canAchieveThird: false,
    });
  }

  if (eligibleUsers.length === 0) return results;

  const picksByGameID = new Map<number, Map<number, UserPick>>();

  for (const user of eligibleUsers) {
    for (const pick of user.picks) {
      let gamePicks = picksByGameID.get(pick.gameID);

      if (!gamePicks) {
        gamePicks = new Map();
        picksByGameID.set(pick.gameID, gamePicks);
      }

      gamePicks.set(user.userID, pick);
    }
  }

  for (let scenario = 0; scenario < scenarioCount; scenario++) {
    const outcomes = decodeScenario(scenario, K);
    const overallInputs: OverallRankInput[] = [];

    for (const user of eligibleUsers) {
      let pointsEarned = user.basePointsEarned;
      let gamesCorrect = user.baseGamesCorrect;

      for (let g = 0; g < K; g++) {
        const game = undecidedGames[g];
        const outcome = outcomes[g];

        if (!game || outcome === undefined) continue;

        const winnerID = getWinnerID(game, outcome, tieTeamID);
        const pick = picksByGameID.get(game.gameID)?.get(user.userID);

        if (pick?.teamID != null && pick.teamID === winnerID && pick.pickPoints != null) {
          pointsEarned += pick.pickPoints;
          gamesCorrect += 1;
        }
      }

      overallInputs.push({ gamesCorrect, pointsEarned, userID: user.userID });
    }

    const ranks = rankUsersOverall(overallInputs);

    for (const [userID, rank] of ranks) {
      const result = results.get(userID);

      if (!result) continue;

      if (rank < result.bestRank) {
        result.bestRank = rank;
      }

      if (rank <= 1) result.canAchieveFirst = true;
      if (rank <= 2) result.canAchieveSecond = true;
      if (rank <= 3) result.canAchieveThird = true;
    }
  }

  return results;
};
