import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockDb: MockDb;

const getCurrentSession = vi.fn();
const revalidatePath = vi.fn();
const cookiesGet = vi.fn();
const cookiesSet = vi.fn();
const headersGet = vi.fn();
const createSession = vi.fn();
const generateSessionToken = vi.fn();
const setSessionTokenCookie = vi.fn();
const verifyLoginEligibility = vi.fn();
const checkRateLimit = vi.fn();
const consumeChallenge = vi.fn();
const storeChallenge = vi.fn();
const insertPasskey = vi.fn();
const recordPasskeyUse = vi.fn();
const renamePasskeyForUser = vi.fn();
const deletePasskeyForUser = vi.fn();
const getPasskeyByCredentialId = vi.fn();
const getPasskeysByUserId = vi.fn();
const generateRegistrationOptions = vi.fn();
const generateAuthenticationOptions = vi.fn();
const verifyRegistrationResponse = vi.fn();
const verifyAuthenticationResponse = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("@nfl-pool-monorepo/db/src/mutations/passkey", () => ({
  consumeChallenge,
  deletePasskeyForUser,
  insertPasskey,
  recordPasskeyUse,
  renamePasskeyForUser,
  storeChallenge,
}));
vi.mock("@nfl-pool-monorepo/db/src/queries/passkey", () => ({ getPasskeyByCredentialId, getPasskeysByUserId }));
vi.mock("@simplewebauthn/server", () => ({
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
}));
vi.mock("@/server/loaders/sessions", () => ({ getCurrentSession }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookiesGet, set: cookiesSet }),
  headers: async () => ({ get: headersGet }),
}));
vi.mock("@/lib/auth", () => ({
  createSession,
  generateSessionToken,
  sanitizeRedirectPath: (raw: string | null | undefined, fallback: string) =>
    raw?.startsWith("/") && !raw.startsWith("//") ? raw : fallback,
  setSessionTokenCookie,
}));
vi.mock("@/lib/auth-verification", () => ({ verifyLoginEligibility }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit, getClientIp: async () => "1.2.3.4" }));
vi.mock("@/lib/passkey/config", () => ({
  getPasskeyConfig: () => ({
    origin: "https://pool.example.com",
    rpID: "pool.example.com",
    rpName: "NFL Confidence Pool",
  }),
}));

const AUTHED_USER = {
  doneRegistering: 1,
  email: "user@example.com",
  id: 7,
  image: null,
  isAdmin: 0,
  name: "Test User",
  playsSurvivor: 0,
};

const REGISTRATION_RESPONSE = {
  clientExtensionResults: {},
  id: "cred-id",
  rawId: "cred-id",
  response: { attestationObject: "att", clientDataJSON: "cdj", transports: ["internal", "hybrid"] },
  type: "public-key" as const,
};

const AUTHENTICATION_RESPONSE = {
  clientExtensionResults: {},
  id: "cred-id",
  rawId: "cred-id",
  response: { authenticatorData: "ad", clientDataJSON: "cdj", signature: "sig" },
  type: "public-key" as const,
};

const STORED_PASSKEY = {
  PasskeyCounter: 4,
  PasskeyCredentialID: "cred-id",
  PasskeyID: 11,
  PasskeyPublicKey: Buffer.from([1, 2, 3]).toString("base64url"),
  PasskeyTransports: "internal",
  UserID: 7,
};

const resetAllMocks = () => {
  mockDb = createMockDb();
  getCurrentSession.mockReset().mockResolvedValue({ session: { id: "s1" }, user: AUTHED_USER });
  revalidatePath.mockReset();
  cookiesGet
    .mockReset()
    .mockImplementation((name: string) => (name === "passkey_challenge" ? { value: "chal-id" } : undefined));
  cookiesSet.mockReset();
  headersGet.mockReset().mockReturnValue("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)");
  createSession.mockReset().mockResolvedValue({ expiresAt: new Date(Date.now() + 1000), id: "hashed", userId: 7 });
  generateSessionToken.mockReset().mockReturnValue("raw-token");
  setSessionTokenCookie.mockReset().mockResolvedValue(undefined);
  verifyLoginEligibility.mockReset().mockResolvedValue(undefined);
  checkRateLimit.mockReset().mockResolvedValue(true);
  consumeChallenge.mockReset().mockResolvedValue("the-challenge");
  storeChallenge.mockReset().mockResolvedValue(undefined);
  insertPasskey.mockReset().mockResolvedValue(undefined);
  recordPasskeyUse.mockReset().mockResolvedValue(undefined);
  renamePasskeyForUser.mockReset().mockResolvedValue(true);
  deletePasskeyForUser.mockReset().mockResolvedValue(true);
  getPasskeyByCredentialId.mockReset().mockResolvedValue(undefined);
  getPasskeysByUserId.mockReset().mockResolvedValue([]);
  generateRegistrationOptions.mockReset().mockResolvedValue({ challenge: "reg-challenge" });
  generateAuthenticationOptions.mockReset().mockResolvedValue({ challenge: "auth-challenge" });
  verifyRegistrationResponse.mockReset();
  verifyAuthenticationResponse.mockReset();
  mockDb.executeTakeFirstOrThrow.mockResolvedValue({ UserDoneRegistering: 1, UserID: 7, UserTrusted: 1 });
  vi.resetModules();
};

describe("getRegistrationOptions", () => {
  beforeEach(resetAllMocks);

  it("requires a signed-in user", async () => {
    getCurrentSession.mockResolvedValue({ session: null, user: null });

    const { getRegistrationOptions } = await import("./passkey");
    const result = await getRegistrationOptions();

    expect(result?.serverError).toBe("Unauthorized");
    expect(generateRegistrationOptions).not.toHaveBeenCalled();
  });

  it("builds options for the session user, excludes existing passkeys and stores the challenge for that user only", async () => {
    getPasskeysByUserId.mockResolvedValue([{ PasskeyCredentialID: "existing", PasskeyTransports: "usb,nfc" }]);

    const { getRegistrationOptions } = await import("./passkey");
    const result = await getRegistrationOptions();

    expect(result?.data).toEqual({ challenge: "reg-challenge" });
    expect(getPasskeysByUserId).toHaveBeenCalledWith(7);
    expect(generateRegistrationOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        authenticatorSelection: { residentKey: "required", userVerification: "preferred" },
        excludeCredentials: [{ id: "existing", transports: ["usb", "nfc"] }],
        rpID: "pool.example.com",
        rpName: "NFL Confidence Pool",
        userName: "user@example.com",
      }),
    );
    expect(storeChallenge).toHaveBeenCalledWith("passkey-reg:7", "reg-challenge", expect.any(Date));
  });

  it("is rate limited", async () => {
    checkRateLimit.mockResolvedValue(false);

    const { getRegistrationOptions } = await import("./passkey");
    const result = await getRegistrationOptions();

    expect(result?.serverError).toContain("Too many passkey attempts");
    expect(storeChallenge).not.toHaveBeenCalled();
  });
});

describe("verifyRegistration", () => {
  beforeEach(resetAllMocks);

  const verifiedRegistration = {
    registrationInfo: {
      credential: { counter: 0, id: "cred-id", publicKey: new Uint8Array([1, 2, 3]) },
      credentialBackedUp: true,
      credentialDeviceType: "multiDevice",
    },
    verified: true,
  };

  it("saves the passkey with the verified fields for the session user", async () => {
    verifyRegistrationResponse.mockResolvedValue(verifiedRegistration);

    const { verifyRegistration } = await import("./passkey");
    const result = await verifyRegistration({ response: REGISTRATION_RESPONSE });

    expect(result?.serverError).toBeUndefined();
    expect(consumeChallenge).toHaveBeenCalledWith("passkey-reg:7");
    expect(verifyRegistrationResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedChallenge: "the-challenge",
        expectedOrigin: "https://pool.example.com",
        expectedRPID: "pool.example.com",
      }),
    );
    expect(insertPasskey).toHaveBeenCalledWith({
      addedBy: "user@example.com",
      PasskeyBackedUp: 1,
      PasskeyCounter: 0,
      PasskeyCredentialID: "cred-id",
      PasskeyDeviceType: "multiDevice",
      PasskeyName: "iPhone passkey",
      PasskeyPublicKey: "AQID",
      PasskeyTransports: "internal,hybrid",
      UserID: 7,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/users/edit");
  });

  it("rejects when the challenge is missing or expired", async () => {
    consumeChallenge.mockResolvedValue(null);

    const { verifyRegistration } = await import("./passkey");
    const result = await verifyRegistration({ response: REGISTRATION_RESPONSE });

    expect(result?.serverError).toContain("expired");
    expect(verifyRegistrationResponse).not.toHaveBeenCalled();
    expect(insertPasskey).not.toHaveBeenCalled();
  });

  it("does not save when verification fails, and the challenge was already consumed", async () => {
    verifyRegistrationResponse.mockRejectedValue(new Error("bad origin"));

    const { verifyRegistration } = await import("./passkey");
    const result = await verifyRegistration({ response: REGISTRATION_RESPONSE });

    expect(result?.serverError).toContain("couldn't verify");
    expect(consumeChallenge).toHaveBeenCalledTimes(1);
    expect(insertPasskey).not.toHaveBeenCalled();
  });

  it("does not save when the library reports the response as unverified", async () => {
    verifyRegistrationResponse.mockResolvedValue({ verified: false });

    const { verifyRegistration } = await import("./passkey");
    const result = await verifyRegistration({ response: REGISTRATION_RESPONSE });

    expect(result?.serverError).toContain("couldn't verify");
    expect(insertPasskey).not.toHaveBeenCalled();
  });

  it("rejects a credential that is already registered", async () => {
    verifyRegistrationResponse.mockResolvedValue(verifiedRegistration);
    getPasskeyByCredentialId.mockResolvedValue({ ...STORED_PASSKEY, UserID: 99 });

    const { verifyRegistration } = await import("./passkey");
    const result = await verifyRegistration({ response: REGISTRATION_RESPONSE });

    expect(result?.serverError).toContain("already registered");
    expect(insertPasskey).not.toHaveBeenCalled();
  });
});

describe("getAuthenticationOptions", () => {
  beforeEach(resetAllMocks);

  it("is public, issues discoverable-credential options and stores the challenge behind a cookie id", async () => {
    getCurrentSession.mockResolvedValue({ session: null, user: null });

    const { getAuthenticationOptions } = await import("./passkey");
    const result = await getAuthenticationOptions();

    expect(result?.data).toEqual({ challenge: "auth-challenge" });
    expect(generateAuthenticationOptions).toHaveBeenCalledWith({
      rpID: "pool.example.com",
      userVerification: "preferred",
    });

    const [identifier, challenge] = storeChallenge.mock.calls[0] ?? [];
    const [cookieName, cookieValue, cookieOptions] = cookiesSet.mock.calls[0] ?? [];

    expect(challenge).toBe("auth-challenge");
    expect(cookieName).toBe("passkey_challenge");
    expect(identifier).toBe(`passkey-auth:${cookieValue}`);
    expect(cookieOptions).toMatchObject({ httpOnly: true, maxAge: 300, sameSite: "lax" });
  });

  it("is rate limited", async () => {
    checkRateLimit.mockResolvedValue(false);

    const { getAuthenticationOptions } = await import("./passkey");
    const result = await getAuthenticationOptions();

    expect(result?.serverError).toContain("Too many passkey attempts");
    expect(storeChallenge).not.toHaveBeenCalled();
  });
});

describe("verifyAuthentication", () => {
  beforeEach(resetAllMocks);

  it("creates a session the same way password login does and returns the redirect", async () => {
    getCurrentSession.mockResolvedValue({ session: null, user: null });
    getPasskeyByCredentialId.mockResolvedValue(STORED_PASSKEY);
    verifyAuthenticationResponse.mockResolvedValue({
      authenticationInfo: { credentialBackedUp: true, newCounter: 5 },
      verified: true,
    });
    cookiesGet.mockImplementation((name: string) => ({
      value: name === "passkey_challenge" ? "chal-id" : "/picks/set",
    }));

    const { verifyAuthentication } = await import("./passkey");
    const result = await verifyAuthentication({ response: AUTHENTICATION_RESPONSE });

    expect(result?.serverError).toBeUndefined();
    expect(result?.data?.metadata.redirectTo).toBe("/picks/set");
    expect(consumeChallenge).toHaveBeenCalledWith("passkey-auth:chal-id");
    expect(verifyAuthenticationResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        credential: { counter: 4, id: "cred-id", publicKey: new Uint8Array([1, 2, 3]), transports: ["internal"] },
        expectedChallenge: "the-challenge",
        expectedOrigin: "https://pool.example.com",
        expectedRPID: "pool.example.com",
      }),
    );
    expect(recordPasskeyUse).toHaveBeenCalledWith(11, 5, true);
    expect(verifyLoginEligibility).toHaveBeenCalledWith({ UserDoneRegistering: 1, UserID: 7, UserTrusted: 1 });
    expect(createSession).toHaveBeenCalledWith("raw-token", 7);
    expect(setSessionTokenCookie).toHaveBeenCalled();
  });

  it("falls back to an empty redirect when the redirect_to cookie is unsafe", async () => {
    getPasskeyByCredentialId.mockResolvedValue(STORED_PASSKEY);
    verifyAuthenticationResponse.mockResolvedValue({
      authenticationInfo: { credentialBackedUp: false, newCounter: 5 },
      verified: true,
    });
    cookiesGet.mockImplementation((name: string) => ({
      value: name === "passkey_challenge" ? "chal-id" : "//evil.example.com",
    }));

    const { verifyAuthentication } = await import("./passkey");
    const result = await verifyAuthentication({ response: AUTHENTICATION_RESPONSE });

    expect(result?.data?.metadata.redirectTo).toBe("");
  });

  it("rejects an unknown credential without creating a session, and the challenge is already consumed", async () => {
    const { verifyAuthentication } = await import("./passkey");
    const result = await verifyAuthentication({ response: AUTHENTICATION_RESPONSE });

    expect(result?.serverError).toContain("don't recognize");
    expect(consumeChallenge).toHaveBeenCalledTimes(1);
    expect(verifyAuthenticationResponse).not.toHaveBeenCalled();
    expect(createSession).not.toHaveBeenCalled();
  });

  it("rejects when there is no challenge cookie", async () => {
    cookiesGet.mockReturnValue(undefined);
    consumeChallenge.mockResolvedValue(null);

    const { verifyAuthentication } = await import("./passkey");
    const result = await verifyAuthentication({ response: AUTHENTICATION_RESPONSE });

    expect(consumeChallenge).not.toHaveBeenCalledWith("passkey-auth:chal-id");
    expect(result?.serverError).toContain("expired");
    expect(createSession).not.toHaveBeenCalled();
  });

  it("clears the challenge cookie even when verification fails, and never updates the counter or session", async () => {
    getPasskeyByCredentialId.mockResolvedValue(STORED_PASSKEY);
    verifyAuthenticationResponse.mockRejectedValue(new Error("counter did not increase"));

    const { verifyAuthentication } = await import("./passkey");
    const result = await verifyAuthentication({ response: AUTHENTICATION_RESPONSE });

    expect(result?.serverError).toContain("couldn't verify");
    expect(cookiesSet).toHaveBeenCalledWith("passkey_challenge", "", expect.objectContaining({ maxAge: 0 }));
    expect(recordPasskeyUse).not.toHaveBeenCalled();
    expect(createSession).not.toHaveBeenCalled();
  });

  it("does not create a session when the user is not eligible to log in", async () => {
    getPasskeyByCredentialId.mockResolvedValue(STORED_PASSKEY);
    verifyAuthenticationResponse.mockResolvedValue({
      authenticationInfo: { credentialBackedUp: false, newCounter: 5 },
      verified: true,
    });
    verifyLoginEligibility.mockRejectedValue(new Error("blocked"));

    const { verifyAuthentication } = await import("./passkey");
    const result = await verifyAuthentication({ response: AUTHENTICATION_RESPONSE });

    expect(result?.serverError).toBeDefined();
    expect(createSession).not.toHaveBeenCalled();
  });

  it("is rate limited before touching the challenge", async () => {
    checkRateLimit.mockResolvedValue(false);

    const { verifyAuthentication } = await import("./passkey");
    const result = await verifyAuthentication({ response: AUTHENTICATION_RESPONSE });

    expect(result?.serverError).toContain("Too many passkey attempts");
    expect(consumeChallenge).not.toHaveBeenCalled();
  });
});

describe("renamePasskey", () => {
  beforeEach(resetAllMocks);

  it("renames only within the session user's passkeys", async () => {
    const { renamePasskey } = await import("./passkey");
    const result = await renamePasskey({ name: "  Work laptop ", passkeyId: 11 });

    expect(result?.serverError).toBeUndefined();
    expect(renamePasskeyForUser).toHaveBeenCalledWith(11, 7, "Work laptop", "user@example.com");
    expect(revalidatePath).toHaveBeenCalledWith("/users/edit");
  });

  it("reports not found for someone else's passkey", async () => {
    renamePasskeyForUser.mockResolvedValue(false);

    const { renamePasskey } = await import("./passkey");
    const result = await renamePasskey({ name: "Mine now", passkeyId: 99 });

    expect(result?.serverError).toBe("Passkey not found");
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("deletePasskey", () => {
  beforeEach(resetAllMocks);

  it("deletes a passkey scoped to the session user", async () => {
    const { deletePasskey } = await import("./passkey");
    const result = await deletePasskey({ passkeyId: 11 });

    expect(result?.serverError).toBeUndefined();
    expect(deletePasskeyForUser).toHaveBeenCalledWith(11, 7);
  });

  it("cannot delete another user's passkey", async () => {
    deletePasskeyForUser.mockResolvedValue(false);

    const { deletePasskey } = await import("./passkey");
    const result = await deletePasskey({ passkeyId: 99 });

    expect(result?.serverError).toBe("Passkey not found");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("requires a signed-in user", async () => {
    getCurrentSession.mockResolvedValue({ session: null, user: null });

    const { deletePasskey } = await import("./passkey");
    const result = await deletePasskey({ passkeyId: 11 });

    expect(result?.serverError).toBe("Unauthorized");
    expect(deletePasskeyForUser).not.toHaveBeenCalled();
  });
});
