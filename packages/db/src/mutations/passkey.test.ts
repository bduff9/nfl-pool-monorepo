import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockDb, type MockDb } from "../test-utils/mockDb";

let mockDb: MockDb;

vi.mock("../kysely", () => ({
  get db() {
    return mockDb;
  },
}));

import { consumeChallenge, deletePasskeyForUser, renamePasskeyForUser, storeChallenge } from "./passkey";

const FUTURE = new Date(Date.now() + 60_000);
const PAST = new Date(Date.now() - 60_000);

beforeEach(() => {
  mockDb = createMockDb();
});

describe("storeChallenge", () => {
  it("replaces any previous challenge for the identifier", async () => {
    await storeChallenge("passkey-reg:7", "challenge", FUTURE);

    expect(mockDb.deleteFrom).toHaveBeenCalledTimes(2);
    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        VerificationRequestExpires: FUTURE,
        VerificationRequestIdentifier: "passkey-reg:7",
        VerificationRequestToken: "challenge",
      }),
    );
  });
});

describe("consumeChallenge", () => {
  const row = (expires: Date) => ({
    VerificationRequestExpires: expires,
    VerificationRequestID: 5,
    VerificationRequestToken: "challenge",
  });

  it("returns null when there is no challenge", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

    expect(await consumeChallenge("passkey-auth:x")).toBeNull();
    expect(mockDb.deleteFrom).not.toHaveBeenCalled();
  });

  it("returns and deletes a live challenge", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce(row(FUTURE)).mockResolvedValueOnce({ numDeletedRows: 1n });

    expect(await consumeChallenge("passkey-auth:x")).toBe("challenge");
    expect(mockDb.where).toHaveBeenCalledWith("VerificationRequestID", "=", 5);
  });

  it("deletes but rejects an expired challenge", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce(row(PAST)).mockResolvedValueOnce({ numDeletedRows: 1n });

    expect(await consumeChallenge("passkey-auth:x")).toBeNull();
    expect(mockDb.deleteFrom).toHaveBeenCalledWith("VerificationRequests");
  });

  it("rejects a challenge another request already consumed", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce(row(FUTURE)).mockResolvedValueOnce({ numDeletedRows: 0n });

    expect(await consumeChallenge("passkey-auth:x")).toBeNull();
  });
});

describe("passkey ownership", () => {
  it("scopes renames and deletes to the owning user", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({ numUpdatedRows: 0n }).mockResolvedValueOnce({ numDeletedRows: 0n });

    expect(await renamePasskeyForUser(11, 7, "Name", "user@example.com")).toBe(false);
    expect(await deletePasskeyForUser(11, 7)).toBe(false);
    expect(mockDb.where).toHaveBeenCalledWith("UserID", "=", 7);
  });

  it("reports success when a row changed", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({ numUpdatedRows: 1n }).mockResolvedValueOnce({ numDeletedRows: 1n });

    expect(await renamePasskeyForUser(11, 7, "Name", "user@example.com")).toBe(true);
    expect(await deletePasskeyForUser(11, 7)).toBe(true);
  });
});
