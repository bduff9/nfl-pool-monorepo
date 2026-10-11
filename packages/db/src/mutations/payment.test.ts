import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockDb, type MockDb } from "../test-utils/mockDb";

type Winner = { Rank: number; UserID: number };

type Scenario = {
  gamesLeft?: number;
  lastPlaceLowest?: number | null;
  lastPlaceWinners?: Array<Winner>;
  lastPlacePrize?: number;
  overallPrizes?: [number, number, number, number];
  overallWinners?: Array<Winner>;
  survivorJustEnded?: boolean;
  survivorPrizes?: [number, number, number];
  survivorWinners?: Array<Winner>;
  weeklyPrizes?: [number, number, number];
  weeklyWinners?: Array<Array<Winner>>;
};

let mockDb: MockDb;
let events: Array<unknown>;

const getOverallPrizeAmounts = vi.fn();
const getOverallPrizeForLastPlace = vi.fn();
const getSurvivorPrizeAmounts = vi.fn();
const getWeeklyPrizeAmounts = vi.fn();
const getSurvivorPoolStatus = vi.fn();

vi.mock("../kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("../queries/survivor", () => ({ getSurvivorPoolStatus }));
vi.mock("../queries/systemValue", () => ({
  getOverallPrizeAmounts,
  getOverallPrizeForLastPlace,
  getSurvivorPrizeAmounts,
  getWeeklyPrizeAmounts,
}));

// Wires the mock db so every query is logged in order in `events`, and selects return the scenario data.
const setup = (scenario: Scenario) => {
  const weeklyQueue = [...(scenario.weeklyWinners ?? [])];
  const overallQueue = [scenario.overallWinners ?? [], scenario.lastPlaceWinners ?? []];
  let currentTable = "";

  getWeeklyPrizeAmounts.mockResolvedValue(scenario.weeklyPrizes ?? [0, 0, 0]);
  getOverallPrizeAmounts.mockResolvedValue(scenario.overallPrizes ?? [0, 0, 0, 0]);
  getOverallPrizeForLastPlace.mockResolvedValue(scenario.lastPlacePrize ?? 0);
  getSurvivorPrizeAmounts.mockResolvedValue(scenario.survivorPrizes ?? [0, 0, 0]);
  getSurvivorPoolStatus.mockResolvedValue({ justEnded: scenario.survivorJustEnded ?? false });

  mockDb.selectFrom.mockImplementation((table: string) => {
    currentTable = table;
    events.push(["select", table]);

    return mockDb;
  });
  mockDb.where.mockImplementation((...args: Array<unknown>) => {
    events.push(["where", ...args]);

    return mockDb;
  });
  mockDb.deleteFrom.mockImplementation((table: string) => {
    currentTable = "";
    events.push(["delete", table]);

    return mockDb;
  });
  mockDb.insertInto.mockImplementation(() => {
    currentTable = "";

    return mockDb;
  });
  mockDb.values.mockImplementation((values: unknown) => {
    events.push(["insert", values]);

    return mockDb;
  });
  mockDb.execute.mockImplementation(() => {
    if (currentTable === "WeeklyMV") return Promise.resolve(weeklyQueue.shift() ?? []);

    if (currentTable === "Games") {
      return Promise.resolve(Array.from({ length: scenario.gamesLeft ?? 0 }, (_, index) => ({ GameID: index })));
    }

    if (currentTable === "OverallMV") return Promise.resolve(overallQueue.shift() ?? []);

    return Promise.resolve(scenario.survivorWinners ?? []);
  });
  mockDb.executeTakeFirstOrThrow.mockImplementation(() =>
    Promise.resolve(currentTable === "OverallMV" ? { Lowest: scenario.lastPlaceLowest ?? 0 } : {}),
  );
};

const inserts = () =>
  events
    .filter((event) => (event as Array<unknown>)[0] === "insert")
    .map((event) => (event as Array<unknown>)[1] as Record<string, unknown>);

const run = async (week: number, trx?: MockDb) => {
  const { updateAllPayouts } = await import("./payment");

  await updateAllPayouts(week, trx as never);
};

const prize = (amount: number, description: string, userID: number, week: number | null) => ({
  PaymentAddedBy: "Admin",
  PaymentAmount: amount,
  PaymentDescription: description,
  PaymentType: "Prize",
  PaymentUpdatedBy: "Admin",
  PaymentWeek: week,
  UserID: userID,
});

describe("updateAllPayouts", () => {
  beforeEach(() => {
    mockDb = createMockDb();
    events = [];
    getOverallPrizeAmounts.mockReset();
    getOverallPrizeForLastPlace.mockReset();
    getSurvivorPrizeAmounts.mockReset();
    getWeeklyPrizeAmounts.mockReset();
    getSurvivorPoolStatus.mockReset();
    vi.resetModules();
  });

  it("opens its own transaction when none is passed and uses the passed transaction otherwise", async () => {
    setup({ gamesLeft: 1 });

    await run(1);

    expect(mockDb.transaction).toHaveBeenCalledTimes(1);

    mockDb.transaction.mockClear();
    events = [];
    await run(1, mockDb);

    expect(mockDb.transaction).not.toHaveBeenCalled();
    expect(getWeeklyPrizeAmounts).toHaveBeenLastCalledWith(mockDb);
  });

  it("clears weekly payments, queries each week up to the current one, then checks the season", async () => {
    setup({ gamesLeft: 3, weeklyPrizes: [0, 10, 5] });

    await run(2, mockDb);

    expect(events).toEqual([
      ["delete", "Payments"],
      ["where", "PaymentWeek", "is not", null],
      ["select", "WeeklyMV"],
      ["where", "Rank", "<", 3],
      ["where", "Week", "=", 1],
      ["select", "WeeklyMV"],
      ["where", "Rank", "<", 3],
      ["where", "Week", "=", 2],
      ["select", "Games"],
      ["where", "GameStatus", "!=", "Final"],
    ]);
    expect(getSurvivorPoolStatus).toHaveBeenCalledWith(2);
  });

  it("pays weekly winners in order using the unsplit prize for each lone place", async () => {
    setup({
      gamesLeft: 1,
      weeklyPrizes: [0, 20, 8],
      weeklyWinners: [
        [
          { Rank: 1, UserID: 7 },
          { Rank: 2, UserID: 8 },
        ],
        [{ Rank: 1, UserID: 9 }],
      ],
    });

    await run(2, mockDb);

    // place 1 has a winner, place 2 has a winner: no collapsing. Week 2: place 2 empty so its prize rolls into 1st.
    expect(inserts()).toEqual([
      prize(20, "1st Place", 7, 1),
      prize(8, "2nd Place", 8, 1),
      prize(28, "1st Place", 9, 2),
    ]);
  });

  it("splits a tied weekly place evenly and rounds to cents", async () => {
    setup({
      gamesLeft: 1,
      weeklyPrizes: [0, 10, 5],
      weeklyWinners: [
        [
          { Rank: 1, UserID: 1 },
          { Rank: 1, UserID: 2 },
          { Rank: 1, UserID: 3 },
        ],
      ],
    });

    await run(1, mockDb);

    // 2nd place is empty so 5 rolls into 1st: (10 + 5) / 3 = 5
    expect(inserts().map((v) => v.PaymentAmount)).toEqual([5, 5, 5]);

    events = [];
    setup({
      gamesLeft: 1,
      weeklyPrizes: [0, 10, 5],
      weeklyWinners: [
        [
          { Rank: 1, UserID: 1 },
          { Rank: 1, UserID: 2 },
          { Rank: 1, UserID: 3 },
          { Rank: 2, UserID: 4 },
          { Rank: 2, UserID: 5 },
          { Rank: 2, UserID: 6 },
        ],
      ],
    });

    await run(1, mockDb);

    // 10 / 3 = 3.3333 -> 3.33 and 5 / 3 = 1.6667 -> 1.67
    expect(inserts().map((v) => v.PaymentAmount)).toEqual([3.33, 3.33, 3.33, 1.67, 1.67, 1.67]);
  });

  it("rounds half cents up and keeps odd cents out of the split", async () => {
    setup({
      gamesLeft: 1,
      weeklyPrizes: [0, 0.05, 0.01],
      weeklyWinners: [
        [
          { Rank: 1, UserID: 1 },
          { Rank: 1, UserID: 2 },
          { Rank: 2, UserID: 3 },
          { Rank: 2, UserID: 4 },
        ],
      ],
    });

    await run(1, mockDb);

    // 0.05 / 2 = 0.025 -> 0.03 (epsilon nudge), 0.01 / 2 = 0.005 -> 0.01
    expect(inserts().map((v) => v.PaymentAmount)).toEqual([0.03, 0.03, 0.01, 0.01]);
  });

  it("collapses an empty place into the previous place and zeroes it", async () => {
    setup({
      gamesLeft: 1,
      weeklyPrizes: [100, 30, 10],
      weeklyWinners: [[{ Rank: 1, UserID: 1 }]],
    });

    await run(1, mockDb);

    expect(inserts()).toEqual([prize(40, "1st Place", 1, 1)]);
  });

  it("writes nothing for a week with no winners but still clears old weekly payments", async () => {
    setup({ gamesLeft: 1, weeklyPrizes: [0, 10, 5], weeklyWinners: [[]] });

    await run(1, mockDb);

    expect(inserts()).toEqual([]);
    expect(events[0]).toEqual(["delete", "Payments"]);
  });

  it("pays a zero amount when the prize pool is zero", async () => {
    setup({ gamesLeft: 1, weeklyPrizes: [0, 0, 0], weeklyWinners: [[{ Rank: 1, UserID: 1 }]] });

    await run(1, mockDb);

    expect(inserts()).toEqual([prize(0, "1st Place", 1, 1)]);
  });

  it("does not touch overall payouts while games remain", async () => {
    setup({ gamesLeft: 2 });

    await run(1, mockDb);

    expect(events.filter((e) => (e as Array<unknown>)[0] === "select").map((e) => (e as Array<string>)[1])).toEqual([
      "WeeklyMV",
      "Games",
    ]);
    expect(getOverallPrizeAmounts).not.toHaveBeenCalled();
  });

  it("clears and pays overall prizes once the season is over, splitting ties", async () => {
    setup({
      lastPlaceLowest: 5,
      lastPlacePrize: 20,
      lastPlaceWinners: [
        { Rank: 5, UserID: 50 },
        { Rank: 5, UserID: 51 },
        { Rank: 5, UserID: 52 },
      ],
      overallPrizes: [0, 100, 50, 25],
      overallWinners: [
        { Rank: 1, UserID: 10 },
        { Rank: 1, UserID: 11 },
        { Rank: 2, UserID: 12 },
      ],
    });

    await run(1, mockDb);

    expect(events).toEqual([
      ["delete", "Payments"],
      ["where", "PaymentWeek", "is not", null],
      ["select", "WeeklyMV"],
      ["where", "Rank", "<", 3],
      ["where", "Week", "=", 1],
      ["select", "Games"],
      ["where", "GameStatus", "!=", "Final"],
      ["delete", "Payments"],
      ["where", "PaymentDescription", "like", "% Overall"],
      ["select", "OverallMV"],
      ["where", "Rank", "<", 4],
      ["insert", prize(50, "1st Place Overall", 10, null)],
      ["insert", prize(50, "1st Place Overall", 11, null)],
      ["insert", prize(75, "2nd Place Overall", 12, null)],
      ["select", "OverallMV"],
      ["where", "GamesMissed", "=", 0],
      ["select", "OverallMV"],
      ["where", "Rank", "=", 5],
      ["insert", prize(6.67, "Last Place Overall", 50, null)],
      ["insert", prize(6.67, "Last Place Overall", 51, null)],
      ["insert", prize(6.67, "Last Place Overall", 52, null)],
    ]);
  });

  it("pays the whole last-place prize to a lone last-place user and an empty place rolls up", async () => {
    setup({
      lastPlaceLowest: 2,
      lastPlacePrize: 15,
      lastPlaceWinners: [{ Rank: 2, UserID: 99 }],
      overallPrizes: [0, 100, 50, 25],
      overallWinners: [{ Rank: 3, UserID: 30 }],
    });

    await run(1, mockDb);

    // 3rd place only: 4th... prizes length 4, ranks < 4. Empty places 1 and 2 roll up while 3rd keeps its 25.
    expect(inserts()).toEqual([prize(25, "3rd Place Overall", 30, null), prize(15, "Last Place Overall", 99, null)]);
  });

  it("writes no last-place payment when no last-place users are found", async () => {
    setup({ lastPlaceLowest: 4, lastPlacePrize: 15, lastPlaceWinners: [] });

    await run(1, mockDb);

    expect(inserts()).toEqual([]);
    expect(getOverallPrizeForLastPlace).toHaveBeenCalledTimes(1);
  });

  it("does not clear survivor payments when the survivor pool has not just ended", async () => {
    setup({ gamesLeft: 1, survivorJustEnded: false });

    await run(1, mockDb);

    expect(events.some((e) => (e as Array<unknown>)[1] === "% Survivor Pool")).toBe(false);
    expect(getSurvivorPrizeAmounts).not.toHaveBeenCalled();
  });

  it("clears and pays survivor prizes when the pool just ended", async () => {
    setup({
      gamesLeft: 1,
      survivorJustEnded: true,
      survivorPrizes: [0, 90, 30],
      survivorWinners: [
        { Rank: 1, UserID: 1 },
        { Rank: 1, UserID: 2 },
        { Rank: 2, UserID: 3 },
      ],
    });

    await run(3, mockDb);

    expect(getSurvivorPoolStatus).toHaveBeenCalledWith(3);
    expect(events).toEqual([
      ["delete", "Payments"],
      ["where", "PaymentWeek", "is not", null],
      ["select", "WeeklyMV"],
      ["where", "Rank", "<", 3],
      ["where", "Week", "=", 1],
      ["select", "WeeklyMV"],
      ["where", "Rank", "<", 3],
      ["where", "Week", "=", 2],
      ["select", "WeeklyMV"],
      ["where", "Rank", "<", 3],
      ["where", "Week", "=", 3],
      ["select", "Games"],
      ["where", "GameStatus", "!=", "Final"],
      ["delete", "Payments"],
      ["where", "PaymentDescription", "like", "% Survivor Pool"],
      ["select", "SurvivorMV"],
      ["where", "Rank", "<", 3],
      ["insert", prize(45, "1st Place Survivor Pool", 1, null)],
      ["insert", prize(45, "1st Place Survivor Pool", 2, null)],
      ["insert", prize(30, "2nd Place Survivor Pool", 3, null)],
    ]);
    expect(inserts()).toEqual([
      prize(45, "1st Place Survivor Pool", 1, null),
      prize(45, "1st Place Survivor Pool", 2, null),
      prize(30, "2nd Place Survivor Pool", 3, null),
    ]);
  });

  it("runs weekly, overall and survivor payouts in that order when everything applies", async () => {
    setup({
      lastPlaceLowest: 3,
      lastPlacePrize: 9,
      lastPlaceWinners: [{ Rank: 3, UserID: 63 }],
      overallPrizes: [0, 40, 0, 0],
      overallWinners: [{ Rank: 1, UserID: 61 }],
      survivorJustEnded: true,
      survivorPrizes: [0, 12, 0],
      survivorWinners: [{ Rank: 1, UserID: 62 }],
      weeklyPrizes: [0, 6, 0],
      weeklyWinners: [[{ Rank: 1, UserID: 60 }]],
    });

    await run(1, mockDb);

    expect(inserts().map((v) => [v.UserID, v.PaymentAmount, v.PaymentDescription, v.PaymentWeek])).toEqual([
      [60, 6, "1st Place", 1],
      [61, 40, "1st Place Overall", null],
      [63, 9, "Last Place Overall", null],
      [62, 12, "1st Place Survivor Pool", null],
    ]);
  });
});
