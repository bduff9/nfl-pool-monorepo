import { createHash } from "node:crypto";

import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendGameTimeChangedEmail } from "../emails/gameTimeChanged";
import { sendNewUserEmail } from "../emails/newUser";
import { sendPickReminderEmail } from "../emails/pickReminder";
import { sendPicksAutoSubmittedEmail } from "../emails/picksAutoSubmitted";
import { sendQuickPickEmail } from "../emails/quickPick";
import { sendSurvivorEliminatedEmail } from "../emails/survivorEliminated";
import { sendSurvivorReminderEmail } from "../emails/survivorReminder";
import { sendUntrustedEmail } from "../emails/untrusted";
import { sendWeekEndedEmail } from "../emails/weekEnded";
import { sendWeekStartedEmail } from "../emails/weekStarted";

let mockDb: MockDb;

const calls: string[] = [];
const getBaseEmailClass = vi.fn();
const sendEmail = vi.fn();
const updateEmailClass = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("@nfl-pool-monorepo/db/src/queries/systemValue", () => ({ getSystemYear: () => Promise.resolve(2026) }));
vi.mock("./env", () => ({ env: { domain: "https://pool.test" } }));
vi.mock("../emails", () => ({
  getBaseEmailClass: (...args: unknown[]) => getBaseEmailClass(...args),
  getBrowserLink: (id: string | null) => (id ? `browser-link:${id}` : ""),
  getUnsubscribeLink: (to: string[]) => `unsubscribe-link:${to.join(",")}`,
  sendEmail: (...args: unknown[]) => sendEmail(...args),
  updateEmailClass: (...args: unknown[]) => updateEmailClass(...args),
}));

const USER = { UserEmail: "user@example.com", UserFirstName: "Pat" };
const NAMELESS_USER = { UserEmail: "user@example.com", UserFirstName: null };

const HOME = {
  GameHomeScore: 21,
  GameVisitorScore: 14,
  TeamCity: "Chicago",
  TeamID: "CHI",
  TeamName: "Bears",
  TeamPrimaryColor: "#061E3E",
  TeamSecondaryColor: "#DF6108",
};
const VISITOR = {
  TeamCity: "New York",
  TeamID: "NYG",
  TeamName: "Giants",
  TeamPrimaryColor: "#03497F",
  TeamSecondaryColor: "#FFFFFF",
};

const ADMIN = { UserEmail: "admin@example.com", UserFirstName: "Ada" };
const NEW_USER = {
  UserEmail: "new@example.com",
  UserID: 9,
  UserName: "New User",
  UserReferredByRaw: "A friend",
  UserTeamName: "Gridiron Gang",
};

const GAME_TIME_INFO = {
  gameID: 1,
  homeTeamName: "Bears",
  newKickoffLabel: "Sun 4:25 PM",
  oldKickoffLabel: "Sun 1:00 PM",
  visitorTeamName: "Giants",
  week: 5,
};
const AUTO_SUBMITTED_INFO = { homeTeamName: "Bears", pickPoints: 16, visitorTeamName: "Giants", week: 5 };

type Sender = {
  name: string;
  prepare?: () => void;
  run: (user: typeof USER | typeof NAMELESS_USER) => Promise<void>;
};

const SENDERS: Sender[] = [
  { name: "pickReminder", run: (user) => sendPickReminderEmail(user, 5, 3) },
  { name: "survivorReminder", run: (user) => sendSurvivorReminderEmail(user, 5, 3) },
  { name: "gameTimeChanged", run: (user) => sendGameTimeChangedEmail(user, GAME_TIME_INFO) },
  { name: "picksAutoSubmitted", run: (user) => sendPicksAutoSubmittedEmail(user, AUTO_SUBMITTED_INFO) },
  {
    name: "picksAutoSubmitted with picked team",
    run: (user) => sendPicksAutoSubmittedEmail(user, { ...AUTO_SUBMITTED_INFO, pickedTeamName: "Bears" }),
  },
  { name: "survivorEliminated", run: (user) => sendSurvivorEliminatedEmail(user, 5) },
  { name: "survivorEliminated with picked team", run: (user) => sendSurvivorEliminatedEmail(user, 5, "Bears") },
  {
    name: "untrusted",
    prepare: () => {
      mockDb.execute.mockResolvedValueOnce([ADMIN]);
    },
    run: () => sendUntrustedEmail(NEW_USER),
  },
  {
    name: "newUser",
    prepare: () => {
      mockDb.execute
        .mockResolvedValueOnce([ADMIN])
        .mockResolvedValueOnce([{ UserHistoryYear: 2024 }, { UserHistoryYear: 2025 }, { UserHistoryYear: 2026 }]);
    },
    run: () => sendNewUserEmail(NEW_USER),
  },
  {
    name: "quickPick",
    prepare: () => {
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(HOME).mockResolvedValueOnce(VISITOR);
    },
    run: (user) => sendQuickPickEmail({ ...user, UserID: 7 }, 5, 3),
  },
  {
    name: "weekStarted",
    prepare: () => {
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(HOME).mockResolvedValueOnce(VISITOR);
    },
    run: (user) => sendWeekStartedEmail(user, 5),
  },
  {
    name: "weekEnded",
    prepare: () => {
      mockDb.executeTakeFirstOrThrow
        .mockResolvedValueOnce(HOME)
        .mockResolvedValueOnce(VISITOR)
        .mockResolvedValueOnce(HOME);
    },
    run: (user) => sendWeekEndedEmail(user, 5),
  },
  {
    name: "weekEnded visitor winner",
    prepare: () => {
      mockDb.executeTakeFirstOrThrow
        .mockResolvedValueOnce({ ...HOME, GameHomeScore: 10, GameVisitorScore: 17 })
        .mockResolvedValueOnce(VISITOR)
        .mockResolvedValueOnce(VISITOR);
    },
    run: (user) => sendWeekEndedEmail(user, 5),
  },
  {
    name: "weekEnded tie",
    prepare: () => {
      mockDb.executeTakeFirstOrThrow
        .mockResolvedValueOnce({ ...HOME, GameHomeScore: 17, GameVisitorScore: 17 })
        .mockResolvedValueOnce(VISITOR)
        .mockResolvedValueOnce(HOME);
    },
    run: (user) => sendWeekEndedEmail(user, 5),
  },
];

// The rendered HTML is hashed to keep the snapshot readable; the plain-text rendering is kept verbatim.
const hashHtml = ([arg]: unknown[]) => [
  {
    ...(arg as { html: string }),
    html: createHash("sha256")
      .update((arg as { html: string }).html)
      .digest("hex"),
  },
];

const record = () => ({
  calls: [...calls],
  consoleError: vi.mocked(console.error).mock.calls,
  getBaseEmailClass: getBaseEmailClass.mock.calls,
  sendEmail: sendEmail.mock.calls.map(hashHtml),
  updateEmailClass: updateEmailClass.mock.calls.map(hashHtml),
});

describe("email senders", () => {
  beforeEach(() => {
    mockDb = createMockDb();
    calls.length = 0;
    vi.stubEnv("domain", "https://pool.test");
    vi.spyOn(console, "error")
      .mockReset()
      .mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    getBaseEmailClass.mockReset().mockImplementation(() => {
      calls.push("getBaseEmailClass");

      return Promise.resolve("email-1");
    });
    sendEmail.mockReset().mockImplementation(() => {
      calls.push("sendEmail");

      return Promise.resolve();
    });
    updateEmailClass.mockReset().mockImplementation(() => {
      calls.push("updateEmailClass");

      return Promise.resolve();
    });
  });

  describe.each(SENDERS)("$name", ({ prepare, run }) => {
    it("sends the email then records it", async () => {
      prepare?.();
      await run(USER);

      expect(record()).toMatchSnapshot();
    });

    it("falls back to player when the user has no first name", async () => {
      prepare?.();
      await run(NAMELESS_USER);

      expect(record()).toMatchSnapshot();
    });

    it("logs, still records the email and does not throw when sending fails", async () => {
      prepare?.();
      sendEmail.mockRejectedValueOnce(new Error("SES down"));
      await run(USER);

      expect(record()).toMatchSnapshot();
    });

    it("renders with an empty browser link when the email record could not be created", async () => {
      prepare?.();
      getBaseEmailClass.mockResolvedValueOnce(null);
      await run(USER);

      expect(record()).toMatchSnapshot();
    });
  });
});
