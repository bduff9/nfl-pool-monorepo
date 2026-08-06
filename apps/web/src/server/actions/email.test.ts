import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockDb: MockDb;

const getCurrentSession = vi.fn();
const sendCustomEmail = vi.fn();
const sendInterestEmail = vi.fn();
const getCustomHtml = vi.fn();
const getCustomPlainText = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("@/server/loaders/sessions", () => ({ getCurrentSession }));
vi.mock("../loaders/sessions", () => ({ getCurrentSession }));
vi.mock("@nfl-pool-monorepo/transactional/emails/custom", () => ({ sendCustomEmail }));
vi.mock("@nfl-pool-monorepo/transactional/emails/interest", () => ({ sendInterestEmail }));
vi.mock("@nfl-pool-monorepo/transactional/emails/templates/CustomEmail", () => ({
  getHtml: getCustomHtml,
  getPlainText: getCustomPlainText,
}));

const ADMIN_USER = {
  doneRegistering: 1,
  email: "admin@example.com",
  id: 1,
  image: null,
  isAdmin: 1,
  name: "Admin User",
  playsSurvivor: 0,
};

const NON_ADMIN_USER = { ...ADMIN_USER, isAdmin: 0 };

const resetAllMocks = () => {
  mockDb = createMockDb();
  getCurrentSession.mockReset().mockResolvedValue({ session: { id: "s1" }, user: ADMIN_USER });
  sendCustomEmail.mockReset().mockResolvedValue(undefined);
  sendInterestEmail.mockReset().mockResolvedValue(undefined);
  getCustomHtml.mockReset().mockResolvedValue("<p>html</p>");
  getCustomPlainText.mockReset().mockResolvedValue("plain text");
  vi.resetModules();
};

describe("getEmailPreview", () => {
  beforeEach(resetAllMocks);

  it("throws when the caller is not an admin", async () => {
    getCurrentSession.mockResolvedValue({ session: { id: "s1" }, user: NON_ADMIN_USER });

    const { getEmailPreview } = await import("./email");
    const result = await getEmailPreview({
      body: "hi",
      emailType: "Custom",
      preview: "preview",
      subject: "subject",
      userFirstName: "Brian",
    });

    expect(result?.serverError).toContain("Unauthorized");
  });

  it("throws for a non-Custom email type", async () => {
    const { getEmailPreview } = await import("./email");
    const result = await getEmailPreview({
      body: "hi",
      emailType: "Interest",
      preview: "preview",
      subject: "subject",
      userFirstName: "Brian",
    });

    expect(result?.serverError).toContain("Invalid email type");
  });

  it("returns rendered html and text for a Custom email", async () => {
    const { getEmailPreview } = await import("./email");
    const result = await getEmailPreview({
      body: "hi",
      emailType: "Custom",
      preview: "preview",
      subject: "subject",
      userFirstName: "Brian",
    });

    expect(result?.serverError).toBeUndefined();
    expect(result?.data?.metadata?.html).toBe("<p>html</p>");
    expect(result?.data?.metadata?.text).toBe("plain text");
  });
});

describe("sendAdminEmail", () => {
  beforeEach(resetAllMocks);

  const BASE_INPUT = {
    body: "hi",
    emailType: "Custom" as const,
    preview: "preview",
    sendTo: "All" as const,
    subject: "subject",
    userEmail: null,
    userFirstName: null,
  };

  it("throws when the caller is not an admin", async () => {
    getCurrentSession.mockResolvedValue({ session: { id: "s1" }, user: NON_ADMIN_USER });

    const { sendAdminEmail } = await import("./email");
    const result = await sendAdminEmail(BASE_INPUT);

    expect(result?.serverError).toContain("Unauthorized");
  });

  it("sends a custom email to every opted-in user when sendTo is All", async () => {
    mockDb.execute.mockResolvedValueOnce([
      { UserEmail: "a@example.com", UserFirstName: "A" },
      { UserEmail: "b@example.com", UserFirstName: "B" },
    ]);

    const { sendAdminEmail } = await import("./email");
    const result = await sendAdminEmail(BASE_INPUT);

    expect(result?.serverError).toBeUndefined();
    expect(result?.data?.metadata?.totalCount).toBe(2);
    expect(result?.data?.metadata?.failedCount).toBe(0);
    expect(sendCustomEmail).toHaveBeenCalledTimes(2);
  });

  it("sends only to the provided recipient when sendTo is New", async () => {
    const { sendAdminEmail } = await import("./email");
    const result = await sendAdminEmail({
      ...BASE_INPUT,
      sendTo: "New",
      userEmail: "new@example.com",
      userFirstName: "New",
    });

    expect(result?.serverError).toBeUndefined();
    expect(mockDb.execute).not.toHaveBeenCalled();
    expect(sendCustomEmail).toHaveBeenCalledTimes(1);
  });

  it("calls sendInterestEmail with the final flag for 'Interest - Final'", async () => {
    mockDb.execute.mockResolvedValueOnce([{ UserEmail: "a@example.com", UserFirstName: "A" }]);

    const { sendAdminEmail } = await import("./email");
    const result = await sendAdminEmail({ ...BASE_INPUT, emailType: "Interest - Final" });

    expect(result?.serverError).toBeUndefined();
    expect(sendInterestEmail).toHaveBeenCalledWith({ UserEmail: "a@example.com", UserFirstName: "A" }, true);
  });

  it("reports failedCount without failing the action when some emails reject", async () => {
    mockDb.execute.mockResolvedValueOnce([
      { UserEmail: "a@example.com", UserFirstName: "A" },
      { UserEmail: "b@example.com", UserFirstName: "B" },
    ]);
    sendCustomEmail.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("SMTP down"));

    const { sendAdminEmail } = await import("./email");
    const result = await sendAdminEmail(BASE_INPUT);

    expect(result?.serverError).toBeUndefined();
    expect(result?.data?.metadata?.failedCount).toBe(1);
    expect(result?.data?.metadata?.totalCount).toBe(2);
  });
});

describe("unsubscribe", () => {
  beforeEach(resetAllMocks);

  it("opts the user out of communications and logs it", async () => {
    getCurrentSession.mockResolvedValue({ session: { id: "s1" }, user: null });
    mockDb.executeTakeFirstOrThrow.mockResolvedValue({});

    const { unsubscribe } = await import("./email");
    const result = await unsubscribe({ email: "user@example.com" });

    expect(result?.serverError).toBeUndefined();
    expect(mockDb.set).toHaveBeenCalledWith({ UserCommunicationsOptedOut: 1 });
  });
});
