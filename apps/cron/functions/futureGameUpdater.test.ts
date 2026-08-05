import { beforeEach, describe, expect, it, vi } from "vitest";

const getSystemYear = vi.fn();
const getEntireSeasonFromApi = vi.fn();
const getCurrentWeek = vi.fn();
const healWeek = vi.fn();
const healPicks = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/queries/systemValue", () => ({ getSystemYear }));
vi.mock("@nfl-pool-monorepo/api/src/index", () => ({ getEntireSeasonFromApi }));
vi.mock("@nfl-pool-monorepo/db/src/queries/week", () => ({ getCurrentWeek }));
vi.mock("@nfl-pool-monorepo/api/src/healing", () => ({ healPicks, healWeek }));

const resetAllMocks = () => {
  getSystemYear.mockReset().mockResolvedValue(2026);
  getEntireSeasonFromApi.mockReset().mockResolvedValue([{ week: 1 }]);
  getCurrentWeek.mockReset().mockResolvedValue(17);
  healWeek.mockReset().mockResolvedValue(undefined);
  healPicks.mockReset().mockResolvedValue(undefined);
  vi.resetModules();
};

describe("futureGameUpdater handler", () => {
  beforeEach(resetAllMocks);

  it("does nothing when the API has no season data", async () => {
    getEntireSeasonFromApi.mockResolvedValue([]);

    const { handler } = await import("./futureGameUpdater");
    await handler(null as never, null as never, null as never);

    expect(healWeek).not.toHaveBeenCalled();
  });

  it("heals every remaining week of the season from the current week onward", async () => {
    const { handler } = await import("./futureGameUpdater");
    await handler(null as never, null as never, null as never);

    expect(healWeek).toHaveBeenCalledWith(17, [{ week: 1 }]);
    expect(healWeek).toHaveBeenCalledWith(18, [{ week: 1 }]);
    expect(healWeek).not.toHaveBeenCalledWith(19, expect.anything());
    expect(healPicks).toHaveBeenCalledWith(17);
    expect(healPicks).toHaveBeenCalledWith(18);
  });
});
