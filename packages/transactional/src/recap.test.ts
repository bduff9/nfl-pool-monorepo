import { describe, expect, it, vi } from "vitest";

import WeeklyEmail, { getPlainText } from "../emails/templates/WeeklyEmail";
import { buildWeekRecap, getRecapLines, getRecapPushMessage, getUserRecap } from "./recap";

vi.mock("@nfl-pool-monorepo/db/src/queries/recap", () => ({
  getFinalGameWinners: vi.fn(),
  getPickCounts: vi.fn(),
  getPickOfTheWeek: vi.fn(),
  getWeeklyScoresThrough: vi.fn(),
}));
vi.mock("./env", () => ({ env: { domain: "https://pool.test" } }));

const score = (UserID: number, UserName: string, Week: number, Rank: number, PointsEarned: number) => ({
  PointsEarned,
  Rank,
  UserID,
  UserName,
  Week,
});
const SCORES = [
  score(1, "Ann", 1, 1, 80),
  score(2, "Bob", 1, 2, 70),
  score(3, "Cy", 1, 3, 60),
  score(1, "Ann", 2, 3, 50),
  score(2, "Bob", 2, 1, 90),
  score(3, "Cy", 2, 1, 90),
];
const WINNERS = [
  { GameID: 10, TeamCity: "New York", TeamName: "Jets", WinnerTeamID: 7 },
  { GameID: 11, TeamCity: "Kansas City", TeamName: "Chiefs", WinnerTeamID: 8 },
];
const COUNTS = [
  { GameID: 10, picks: 1, TeamID: 7 },
  { GameID: 10, picks: 9, TeamID: 6 },
  { GameID: 11, picks: 8, TeamID: 8 },
  { GameID: 11, picks: 2, TeamID: 9 },
];
const CORRECT = [
  { PickPoints: 16, TeamCity: "Kansas City", TeamName: "Chiefs", UserFirstName: "Bob", UserLastName: "B" },
  { PickPoints: 16, TeamCity: "Kansas City", TeamName: "Chiefs", UserFirstName: "Cy", UserLastName: null },
];

describe("buildWeekRecap", () => {
  const recap = buildWeekRecap(2, SCORES, WINNERS, COUNTS, CORRECT);

  it("finds the week's tied winners and top score", () => {
    expect(recap.winners).toEqual(["Bob", "Cy"]);
    expect(recap.topScore).toBe(90);
  });

  it("finds the game whose winner the fewest people picked", () => {
    expect(recap.upset).toEqual({ percent: 10, team: "New York Jets" });
  });

  it("ties the pick of the week", () => {
    expect(recap.pickOfTheWeek).toEqual({
      picks: [
        { name: "Bob B", team: "Kansas City Chiefs" },
        { name: "Cy", team: "Kansas City Chiefs" },
      ],
      points: 16,
    });
  });

  it("derives overall movement from the running weekly totals", () => {
    expect(recap.overall.get(1)).toEqual({ previousRank: 1, rank: 3 });
    expect(recap.overall.get(2)).toEqual({ previousRank: 2, rank: 1 });
    expect(recap.overall.get(3)).toEqual({ previousRank: 3, rank: 2 });
  });

  it("has no previous overall rank in week 1 and no upset or pick without data", () => {
    const first = buildWeekRecap(1, SCORES, [], [], []);

    expect(first.overall.get(1)).toEqual({ previousRank: null, rank: 1 });
    expect(first.upset).toBeNull();
    expect(first.pickOfTheWeek).toBeNull();
  });

  it("scores a winner nobody picked as 0 percent and skips games without picks", () => {
    const { upset } = buildWeekRecap(2, SCORES, WINNERS, [{ GameID: 10, picks: 4, TeamID: 6 }], []);

    expect(upset).toEqual({ percent: 0, team: "New York Jets" });
  });
});

describe("user recap", () => {
  const recap = buildWeekRecap(2, SCORES, WINNERS, COUNTS, CORRECT);

  it("is null without a recap or for a user who did not play", () => {
    expect(getUserRecap(null, 1)).toBeNull();
    expect(getUserRecap(recap, 99)).toBeNull();
  });

  it("describes the week for the recipient", () => {
    const user = getUserRecap(recap, 1);

    expect(user).toMatchObject({ overallRank: 3, points: 50, rank: 3 });
    expect(user && getRecapLines(user)).toMatchInlineSnapshot(`
      [
        "Week winner: Bob and Cy with 90 points.",
        "You are 3rd overall, down 2 spots from last week.",
        "Biggest upset: the New York Jets won while only 10% of the pool picked them.",
        "Pick of the week: 16 points on the Kansas City Chiefs from Bob B and Cy.",
      ]
    `);
  });

  it("words the push message", () => {
    expect(getRecapPushMessage(6, { PointsEarned: 87, Rank: 3 })).toBe("Week 6 recap: you finished 3rd with 87 pts.");
  });
});

describe("weekly email recap", () => {
  const props = { ...WeeklyEmail.PreviewProps, articles: [] };

  it("renders the recap section in plain text", async () => {
    expect(await getPlainText(props)).toMatchSnapshot();
  });

  it("omits the recap section without recap data", async () => {
    expect(await getPlainText({ ...props, recap: null })).not.toContain("Recap");
  });
});
