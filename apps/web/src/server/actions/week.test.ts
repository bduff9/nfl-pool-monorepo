import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const cookiesSet = vi.fn();

vi.mock("@/server/loaders/sessions", () => ({ getCurrentSession }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ set: cookiesSet }),
}));

const AUTHED_USER = {
  doneRegistering: 1,
  email: "user@example.com",
  id: 1,
  image: null,
  isAdmin: 0,
  name: "Test User",
  playsSurvivor: 0,
};

describe("setSelectedWeek", () => {
  beforeEach(() => {
    getCurrentSession.mockReset().mockResolvedValue({ session: { id: "s1" }, user: AUTHED_USER });
    cookiesSet.mockReset();
    vi.resetModules();
  });

  it("stores the selected week in a cookie for a week", async () => {
    const { setSelectedWeek } = await import("./week");
    const result = await setSelectedWeek(5);

    expect(result?.serverError).toBeUndefined();
    expect(cookiesSet).toHaveBeenCalledWith("selectedWeek", "5", expect.objectContaining({ maxAge: 7 * 24 * 60 * 60 }));
  });
});
