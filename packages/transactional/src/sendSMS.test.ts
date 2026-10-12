import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendSMS } from "../sms";
import { TwilioError } from "../sms/twilio";

let mockDb: MockDb;

const sendTwilioMessage = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("./env", () => ({ env: { domain: "https://pool.test", TWILIO_PHONE_NUMBER: "+15550001111" } }));
vi.mock("../sms/twilio", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../sms/twilio")>()),
  sendTwilioMessage: (...args: unknown[]) => sendTwilioMessage(...args),
}));

describe("sendSMS", () => {
  beforeEach(() => {
    mockDb = createMockDb();
    sendTwilioMessage.mockReset();
  });

  it("sends the message from the configured number", async () => {
    sendTwilioMessage.mockResolvedValueOnce(undefined);

    await sendSMS("5551234567", "hello", "custom");

    expect(sendTwilioMessage).toHaveBeenCalledWith(
      expect.objectContaining({ from: "+15550001111", to: "+15551234567" }),
    );
  });

  it("disables SMS for the user when Twilio reports an opt-out (21610)", async () => {
    sendTwilioMessage.mockRejectedValueOnce(new TwilioError({ body: { code: 21_610 }, status: 400 }));
    mockDb.executeTakeFirst.mockResolvedValueOnce({ UserID: 7 });

    await expect(sendSMS("5551234567", "hello", "custom")).resolves.toBeUndefined();

    expect(mockDb.updateTable).toHaveBeenCalledWith("Notifications");
    expect(mockDb.updateTable).toHaveBeenCalledWith("Users");
  });

  it("rethrows other Twilio errors", async () => {
    sendTwilioMessage.mockRejectedValueOnce(new TwilioError({ body: { code: 30_003 }, status: 400 }));

    await expect(sendSMS("5551234567", "hello", "custom")).rejects.toMatchObject({ code: 30_003 });
  });
});
