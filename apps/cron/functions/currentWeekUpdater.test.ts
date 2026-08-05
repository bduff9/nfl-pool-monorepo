import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentWeek = vi.fn();
const getSingleWeekFromApi = vi.fn();
const updateTeamData = vi.fn();
const updateSpreads = vi.fn();
const getHoursToWeekStart = vi.fn();
const sendReminderEmails = vi.fn();
const sendReminderTexts = vi.fn();
const sendReminderPushNotifications = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/queries/week", () => ({ getCurrentWeek }));
vi.mock("@nfl-pool-monorepo/api/src", () => ({ getSingleWeekFromApi }));
vi.mock("@nfl-pool-monorepo/api/src/utils", () => ({ updateTeamData }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/game", () => ({ updateSpreads }));
vi.mock("@nfl-pool-monorepo/db/src/queries/game", () => ({ getHoursToWeekStart }));
vi.mock("@nfl-pool-monorepo/transactional/src/reminders", () => ({
  sendReminderEmails,
  sendReminderPushNotifications,
  sendReminderTexts,
}));

const makeGame = () => ({
  team: [
    { id: "5", isHome: true },
    { id: "9", isHome: false },
  ],
});

const resetAllMocks = () => {
  getCurrentWeek.mockReset().mockResolvedValue(5);
  getSingleWeekFromApi.mockReset().mockResolvedValue([makeGame()]);
  updateTeamData.mockReset().mockResolvedValue(undefined);
  updateSpreads.mockReset().mockResolvedValue(undefined);
  getHoursToWeekStart.mockReset().mockResolvedValue(0);
  sendReminderEmails.mockReset().mockResolvedValue(undefined);
  sendReminderTexts.mockReset().mockResolvedValue(undefined);
  sendReminderPushNotifications.mockReset().mockResolvedValue(undefined);
  vi.resetModules();
};

describe("currentWeekUpdater handler", () => {
  beforeEach(resetAllMocks);

  it("updates spreads and team data for every game in the current week", async () => {
    const { handler } = await import("./currentWeekUpdater");
    await handler(null as never, null as never, null as never);

    expect(updateSpreads).toHaveBeenCalledWith(5, expect.anything());
    expect(updateTeamData).toHaveBeenCalledTimes(2);
  });

  it("doesn't send reminders when the week hasn't started yet in less than the reminder window", async () => {
    getHoursToWeekStart.mockResolvedValue(0);

    const { handler } = await import("./currentWeekUpdater");
    await handler(null as never, null as never, null as never);

    expect(sendReminderEmails).not.toHaveBeenCalled();
  });

  it("sends reminder emails, texts, and push notifications when hours remain before the week starts", async () => {
    getHoursToWeekStart.mockResolvedValue(12);

    const { handler } = await import("./currentWeekUpdater");
    await handler(null as never, null as never, null as never);

    expect(sendReminderEmails).toHaveBeenCalledWith(12, 5);
    expect(sendReminderTexts).toHaveBeenCalledWith(12, 5);
    expect(sendReminderPushNotifications).toHaveBeenCalledWith(12, 5);
  });
});
