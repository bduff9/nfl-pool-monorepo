import scoreboardFixture from "@nfl-pool-monorepo/api/src/espn/fixtures/espnScoreboard.json";
import summaryFixture from "@nfl-pool-monorepo/api/src/espn/fixtures/espnSummaryBufLar.json";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getLiveAlertGames = vi.fn();
const getLiveAlertSubscriberIds = vi.fn();
const getWeekProjectionGames = vi.fn();
const getWeekProjectionPicks = vi.fn();
const getAliveSurvivorPicks = vi.fn();
const sendLiveAlerts = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/queries/liveAlerts", () => ({
  getAliveSurvivorPicks,
  getLiveAlertGames,
  getLiveAlertSubscriberIds,
  getWeekProjectionGames,
  getWeekProjectionPicks,
}));
vi.mock("@nfl-pool-monorepo/transactional/src/liveAlerts/sendLiveAlerts", () => ({ sendLiveAlerts }));

const { handler } = await import("./liveGameAlerts");

// BUF (visitor, team 4) at LAR (home, team 28): the real Monday night game from week 5, 2026. It went to
// overtime and BUF won 37-34. Everything else in the week is synthetic.
const BUF = 4;
const LAR = 28;

const dbGame = {
  GameID: 1,
  GameWeek: 5,
  HomeTeamID: LAR,
  HomeTeamName: "Rams",
  HomeTeamShortName: "LAR",
  VisitorTeamID: BUF,
  VisitorTeamName: "Bills",
  VisitorTeamShortName: "BUF",
};

const weekGames = [
  {
    GameHomeScore: 0,
    GameID: 1,
    GameStatus: "4th Quarter",
    GameVisitorScore: 0,
    HomeTeamID: LAR,
    VisitorTeamID: BUF,
    WinnerTeamID: null,
  },
  {
    GameHomeScore: 10,
    GameID: 2,
    GameStatus: "Final",
    GameVisitorScore: 3,
    HomeTeamID: 40,
    VisitorTeamID: 41,
    WinnerTeamID: 40,
  },
  {
    GameHomeScore: 0,
    GameID: 3,
    GameStatus: "Pregame",
    GameVisitorScore: 0,
    HomeTeamID: 50,
    VisitorTeamID: 51,
    WinnerTeamID: null,
  },
];

const pick = (UserID: number, GameID: number, TeamID: number, PickPoints: number) => ({
  GameID,
  PickPoints,
  TeamID,
  UserID,
});

// Users 1 and 2 play survivor (BUF and LAR). Users 3-6 are confidence players with BUF/LAR and the final game 2.
const picks = [
  pick(3, 1, BUF, 14),
  pick(3, 2, 40, 5),
  pick(4, 1, LAR, 15),
  pick(4, 2, 41, 1),
  pick(5, 1, BUF, 3),
  pick(5, 2, 40, 12),
  pick(6, 1, LAR, 2),
  pick(6, 2, 40, 17),
];

type Play = { id: string; wallclock?: string };

const serve = (scoreboard: unknown, summary: unknown) =>
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve(new Response(JSON.stringify(url.includes("/summary") ? summary : scoreboard))),
    ),
  );

/** The fixture as ESPN would have served it while the game was still going: cut off at `now`. */
const liveAt = (now: Date) => {
  const cutoff = (play: Play) => new Date(play.wallclock ?? 0) <= now;
  const plays = summaryFixture.drives.previous[0]?.plays.filter(cutoff) ?? [];
  const scoringPlays = summaryFixture.scoringPlays.filter((play) =>
    plays.some((candidate) => candidate.id === play.id),
  );
  const last = scoringPlays[scoringPlays.length - 1];
  const event = structuredClone(scoreboardFixture.events[0]);
  const competition = event?.competitions[0];

  if (competition && last) {
    competition.status = {
      ...competition.status,
      period: last.period.number,
      type: { ...competition.status.type, state: "in" },
    };
    competition.competitors[0] = { ...competition.competitors[0], score: String(last.homeScore) } as never;
    competition.competitors[1] = { ...competition.competitors[1], score: String(last.awayScore) } as never;
  }

  return {
    scoreboard: { events: [event] },
    summary: { ...summaryFixture, drives: { previous: [{ id: "d1", plays }] }, scoringPlays },
  };
};

const runAt = async (now: Date, state: "final" | "live") => {
  vi.setSystemTime(now);

  const served = state === "live" ? liveAt(now) : { scoreboard: scoreboardFixture, summary: summaryFixture };

  serve(served.scoreboard, served.summary);
  await handler(undefined as never, {} as never, () => undefined);

  const alerts = (sendLiveAlerts.mock.calls[0]?.[0] ?? []) as Array<{
    body: string;
    key: string;
    type: string;
    userId: number;
  }>;

  return alerts.map(({ body, key, type, userId }) => `${type} u${userId} [${key}] ${body}`);
};

describe("live game alerts against the real BUF @ LAR fixture", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    getLiveAlertGames.mockReset().mockResolvedValue([dbGame]);
    getLiveAlertSubscriberIds.mockReset().mockResolvedValue([1, 2, 3, 4, 5, 6]);
    getWeekProjectionGames.mockReset().mockResolvedValue(weekGames);
    getWeekProjectionPicks.mockReset().mockResolvedValue(picks);
    getAliveSurvivorPicks.mockReset().mockResolvedValue([
      { TeamID: BUF, UserID: 1 },
      { TeamID: LAR, UserID: 2 },
    ]);
    sendLiveAlerts.mockReset().mockResolvedValue({ failed: 0, sent: 0, skipped: 0 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("announces the two recent 4th quarter lead changes while the game is live", async () => {
    const lines = await runAt(new Date("2026-10-13T02:46:30Z"), "live");

    expect(lines).toEqual([
      "survivorBehind u1 [4018729943307] BUF now trails LAR 20–19 in the 4th. Your survivor pick is in trouble.",
      "survivorBehind u2 [4018729943512] LAR now trails BUF 27–20 in the 4th. Your survivor pick is in trouble.",
      "leadChange u3 [4018729943307] LAR takes a 20–19 lead over BUF in the 4th — your 14-point pick is now losing.",
      "leadChange u4 [4018729943307] LAR takes a 20–19 lead over BUF in the 4th — your 15-point pick is now winning.",
      "leadChange u5 [4018729943307] LAR takes a 20–19 lead over BUF in the 4th — your 3-point pick is now losing.",
      "leadChange u6 [4018729943307] LAR takes a 20–19 lead over BUF in the 4th — your 2-point pick is now winning.",
      "leadChange u3 [4018729943512] BUF takes a 27–20 lead over LAR in the 4th — your 14-point pick is now winning.",
      "leadChange u4 [4018729943512] BUF takes a 27–20 lead over LAR in the 4th — your 15-point pick is now losing.",
      "leadChange u5 [4018729943512] BUF takes a 27–20 lead over LAR in the 4th — your 3-point pick is now winning.",
      "leadChange u6 [4018729943512] BUF takes a 27–20 lead over LAR in the 4th — your 2-point pick is now losing.",
      "rankChange u3 [4018729943307] You've dropped to projected 4th for week 5.",
      "rankChange u4 [4018729943307] You've moved up to projected 2nd for week 5.",
      "rankChange u6 [4018729943307] You're now projected 1st for week 5!",
      "rankChange u3 [4018729943512] You're now projected 1st for week 5!",
      "rankChange u4 [4018729943512] You've dropped to projected 4th for week 5.",
      "rankChange u6 [4018729943512] You've dropped to projected 2nd for week 5.",
    ]);
  });

  it("announces the overtime lead change and the result once the game has ended", async () => {
    const lines = await runAt(new Date("2026-10-13T03:50:00Z"), "final");

    expect(lines).toEqual([
      "survivorBehind u2 [4018729944965] LAR now trails BUF 37–34 in overtime. Your survivor pick is in trouble.",
      "survivorResult u1 [401872994] BUF won 37–34. You survive week 5!",
      "survivorResult u2 [401872994] LAR lost 37–34. Your survivor pick is likely out (official result coming soon).",
      "leadChange u3 [4018729944965] BUF takes a 37–34 lead over LAR in overtime — your 14-point pick is now winning.",
      "leadChange u4 [4018729944965] BUF takes a 37–34 lead over LAR in overtime — your 15-point pick is now losing.",
      "leadChange u5 [4018729944965] BUF takes a 37–34 lead over LAR in overtime — your 3-point pick is now winning.",
      "leadChange u6 [4018729944965] BUF takes a 37–34 lead over LAR in overtime — your 2-point pick is now losing.",
      "rankChange u3 [4018729944965] You're now projected 1st for week 5!",
      "rankChange u5 [4018729944965] You've dropped to projected 3rd for week 5.",
      "rankChange u6 [4018729944965] You've dropped to projected 2nd for week 5.",
      "pointsEarned u3 [401872994] You just earned 14 points: the Bills beat the Rams 37–34.",
      "pointsEarned u5 [401872994] You just earned 3 points: the Bills beat the Rams 37–34.",
    ]);
  });

  it("sends nothing about a game that ended long ago, such as on a first deploy the next day", async () => {
    expect(await runAt(new Date("2026-10-13T06:00:00Z"), "final")).toEqual([]);
  });
});
