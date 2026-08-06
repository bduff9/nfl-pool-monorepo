import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockDb: MockDb;

const getCurrentSession = vi.fn();
const revalidatePath = vi.fn();
const cookiesGet = vi.fn();
const cookiesSet = vi.fn();
const ensureUserIsInPublicLeague = vi.fn();
const insertUserHistoryRecord = vi.fn();
const populateUserData = vi.fn();
const getPoolCost = vi.fn();
const sendNewUserEmail = vi.fn();
const sendPasswordResetEmail = vi.fn();
const sendTrustedEmail = vi.fn();
const sendUntrustedEmail = vi.fn();
const createSession = vi.fn();
const generateSessionToken = vi.fn();
const hashPassword = vi.fn();
const invalidateAllSessions = vi.fn();
const mxExists = vi.fn();
const setSessionTokenCookie = vi.fn();
const verifyPasswordHash = vi.fn();
const verifyPasswordStrength = vi.fn();
const verifyLoginEligibility = vi.fn();
const verifyRegistrationEligibility = vi.fn();
const updateUserNotifications = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("@/server/loaders/sessions", () => ({ getCurrentSession }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookiesGet, set: cookiesSet }),
}));
vi.mock("@nfl-pool-monorepo/db/src/mutations/leagues", () => ({ ensureUserIsInPublicLeague }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/userHistory", () => ({ insertUserHistoryRecord }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/users", () => ({ populateUserData }));
vi.mock("@nfl-pool-monorepo/db/src/queries/systemValue", () => ({ getPoolCost }));
vi.mock("@nfl-pool-monorepo/transactional/emails/newUser", () => ({ sendNewUserEmail }));
vi.mock("@nfl-pool-monorepo/transactional/emails/passwordReset", () => ({ sendPasswordResetEmail }));
vi.mock("@nfl-pool-monorepo/transactional/emails/trusted", () => ({ sendTrustedEmail }));
vi.mock("@nfl-pool-monorepo/transactional/emails/untrusted", () => ({ sendUntrustedEmail }));
vi.mock("@/lib/auth", () => ({
  createSession,
  generateSessionToken,
  hashPassword,
  invalidateAllSessions,
  mxExists,
  setSessionTokenCookie,
  verifyPasswordHash,
  verifyPasswordStrength,
}));
vi.mock("@/lib/auth-verification", () => ({ verifyLoginEligibility, verifyRegistrationEligibility }));
vi.mock("./notification", () => ({ updateUserNotifications }));

const AUTHED_USER = {
  doneRegistering: 1,
  email: "user@example.com",
  id: 1,
  image: null,
  isAdmin: 0,
  name: "Test User",
  playsSurvivor: 0,
};

const ADMIN_USER = { ...AUTHED_USER, isAdmin: 1 };

const resetAllMocks = () => {
  mockDb = createMockDb();
  getCurrentSession.mockReset().mockResolvedValue({ session: { id: "s1" }, user: AUTHED_USER });
  revalidatePath.mockReset();
  cookiesGet.mockReset().mockReturnValue(undefined);
  cookiesSet.mockReset();
  ensureUserIsInPublicLeague.mockReset().mockResolvedValue(undefined);
  insertUserHistoryRecord.mockReset().mockResolvedValue(undefined);
  populateUserData.mockReset().mockResolvedValue(undefined);
  getPoolCost.mockReset().mockResolvedValue(40);
  sendNewUserEmail.mockReset().mockResolvedValue(undefined);
  sendPasswordResetEmail.mockReset().mockResolvedValue(undefined);
  sendTrustedEmail.mockReset().mockResolvedValue(undefined);
  sendUntrustedEmail.mockReset().mockResolvedValue(undefined);
  createSession
    .mockReset()
    .mockResolvedValue({ expiresAt: new Date(Date.now() + 1000), id: "hashed-token", userId: 1 });
  generateSessionToken.mockReset().mockReturnValue("raw-token");
  hashPassword.mockReset().mockResolvedValue("hashed-password");
  invalidateAllSessions.mockReset().mockResolvedValue(undefined);
  mxExists.mockReset().mockResolvedValue(true);
  setSessionTokenCookie.mockReset().mockResolvedValue(undefined);
  verifyPasswordHash.mockReset().mockResolvedValue(true);
  verifyPasswordStrength.mockReset().mockResolvedValue(true);
  verifyLoginEligibility.mockReset().mockResolvedValue(undefined);
  verifyRegistrationEligibility.mockReset().mockResolvedValue(undefined);
  updateUserNotifications.mockReset().mockResolvedValue(undefined);
  vi.resetModules();
};

describe("editMyProfile", () => {
  beforeEach(resetAllMocks);

  it("updates the user and each notification within a transaction, then revalidates", async () => {
    const { editMyProfile } = await import("./user");
    const result = await editMyProfile({
      notifications: [
        {
          NotificationEmail: 1,
          NotificationEmailHoursBefore: 12,
          NotificationID: 1,
          NotificationPushNotification: 0,
          NotificationPushNotificationHoursBefore: null,
          NotificationSMS: 0,
          NotificationSMSHoursBefore: null,
          NotificationType: "SubmitPickReminder",
        },
      ],
      UserAutoPickStrategy: "Home",
      UserAutoPicksLeft: 3,
      UserEmail: "user@example.com",
      UserFirstName: "Brian",
      UserLastName: "Duffey",
      UserPaymentAccount: "brian@example.com",
      UserPaymentType: "Paypal",
      UserPhone: "",
      UserTeamName: "Team",
    });

    expect(result?.serverError).toBeUndefined();
    expect(result?.data?.status).toBe("Success");
    expect(mockDb.executeTakeFirstOrThrow).toHaveBeenCalledTimes(2);
    expect(revalidatePath).toHaveBeenCalledWith("/users/edit");
  });
});

describe("finishRegistration", () => {
  beforeEach(resetAllMocks);

  const INPUT = {
    UserEmail: "new@example.com",
    UserFirstName: "New",
    UserLastName: "User",
    UserName: "New User",
    UserPaymentAccount: "new@example.com",
    UserPaymentType: "Paypal" as const,
    UserPlaysSurvivor: true,
    UserReferredByRaw: "Brian Duffey",
    UserTeamName: "Team",
  };

  it("throws when the user has already finished registration", async () => {
    getCurrentSession.mockResolvedValue({
      session: { id: "s1" },
      user: { ...AUTHED_USER, doneRegistering: 1 },
    });

    const { finishRegistration } = await import("./user");
    const result = await finishRegistration(INPUT);

    expect(result?.serverError).toContain("User has already finished registration");
  });

  it("throws when the user cannot be found", async () => {
    getCurrentSession.mockResolvedValue({
      session: { id: "s1" },
      user: { ...AUTHED_USER, doneRegistering: 0 },
    });
    mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

    const { finishRegistration } = await import("./user");
    const result = await finishRegistration(INPUT);

    expect(result?.serverError).toContain("User not found");
  });

  it("throws when the user has been blocked", async () => {
    getCurrentSession.mockResolvedValue({
      session: { id: "s1" },
      user: { ...AUTHED_USER, doneRegistering: 0 },
    });
    mockDb.executeTakeFirst.mockResolvedValueOnce({ UserEmail: "new@example.com", UserTrusted: 0 });

    const { finishRegistration } = await import("./user");
    const result = await finishRegistration(INPUT);

    expect(result?.serverError).toContain("User has been blocked");
  });

  it("marks the user as trusted and registered when a valid referrer is found", async () => {
    getCurrentSession.mockResolvedValue({
      session: { id: "s1" },
      user: { ...AUTHED_USER, doneRegistering: 0 },
    });
    mockDb.executeTakeFirst
      .mockResolvedValueOnce({ UserEmail: "new@example.com", UserTrusted: null })
      .mockResolvedValueOnce({ UserID: 3 });

    const { finishRegistration } = await import("./user");
    const result = await finishRegistration(INPUT);

    expect(result?.serverError).toBeUndefined();
    expect(result?.data?.metadata?.isTrusted).toBe(true);
    expect(sendUntrustedEmail).not.toHaveBeenCalled();
    expect(populateUserData).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/users/create");
  });

  it("sends the untrusted email and leaves registration incomplete when no referrer is found", async () => {
    getCurrentSession.mockResolvedValue({
      session: { id: "s1" },
      user: { ...AUTHED_USER, doneRegistering: 0 },
    });
    mockDb.executeTakeFirst
      .mockResolvedValueOnce({ UserEmail: "new@example.com", UserTrusted: null })
      .mockResolvedValueOnce(undefined);

    const { finishRegistration } = await import("./user");
    const result = await finishRegistration(INPUT);

    expect(result?.serverError).toBeUndefined();
    expect(result?.data?.metadata?.isTrusted).toBe(false);
    expect(sendUntrustedEmail).toHaveBeenCalledWith(INPUT);
    expect(populateUserData).not.toHaveBeenCalled();
  });

  it("finishes registration directly when the user is already trusted", async () => {
    getCurrentSession.mockResolvedValue({
      session: { id: "s1" },
      user: { ...AUTHED_USER, doneRegistering: 0 },
    });
    mockDb.executeTakeFirst.mockResolvedValueOnce({ UserEmail: "new@example.com", UserTrusted: 1 });

    const { finishRegistration } = await import("./user");
    const result = await finishRegistration(INPUT);

    expect(result?.serverError).toBeUndefined();
    expect(result?.data?.metadata?.isTrusted).toBe(true);
    expect(populateUserData).toHaveBeenCalled();
  });
});

describe("login", () => {
  beforeEach(resetAllMocks);

  it("throws 'Invalid email or password' when the user isn't found", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

    const { login } = await import("./user");
    const result = await login({ email: "nobody@example.com", isLogin: true, password: "password123" });

    expect(result?.serverError).toContain("Invalid email or password");
  });

  it("throws when the user has no password hash set", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({
      UserDoneRegistering: 1,
      UserID: 1,
      UserPasswordHash: null,
      UserTrusted: 1,
    });

    const { login } = await import("./user");
    const result = await login({ email: "user@example.com", isLogin: true, password: "password123" });

    expect(result?.serverError).toContain("Forgot Password");
  });

  it("throws 'Invalid email or password' when the password doesn't match", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({
      UserDoneRegistering: 1,
      UserID: 1,
      UserPasswordHash: "hashed",
      UserTrusted: 1,
    });
    verifyPasswordHash.mockResolvedValue(false);

    const { login } = await import("./user");
    const result = await login({ email: "user@example.com", isLogin: true, password: "wrong-password" });

    expect(result?.serverError).toContain("Invalid email or password");
    expect(verifyLoginEligibility).not.toHaveBeenCalled();
  });

  it("creates a session and returns the redirect cookie on success", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({
      UserDoneRegistering: 1,
      UserID: 1,
      UserPasswordHash: "hashed",
      UserTrusted: 1,
    });
    cookiesGet.mockReturnValue({ value: "/picks/set" });

    const { login } = await import("./user");
    const result = await login({ email: "user@example.com", isLogin: true, password: "password123" });

    expect(result?.serverError).toBeUndefined();
    expect(result?.data?.metadata?.redirectTo).toBe("/picks/set");
    expect(createSession).toHaveBeenCalledWith("raw-token", 1);
    expect(setSessionTokenCookie).toHaveBeenCalled();
  });
});

describe("markUserAsTrusted", () => {
  beforeEach(() => {
    resetAllMocks();
    getCurrentSession.mockResolvedValue({ session: { id: "s1" }, user: ADMIN_USER });
  });

  it("throws when a user is referred by themselves", async () => {
    const { markUserAsTrusted } = await import("./user");
    const result = await markUserAsTrusted({ referredByUserId: 5, userId: 5 });

    expect(result?.serverError).toContain("cannot refer themselves");
  });

  it("throws when the user is already trusted", async () => {
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({
      UserEmail: "u@example.com",
      UserFirstName: "U",
      UserID: 5,
      UserName: "U Name",
      UserPlaysSurvivor: 0,
      UserReferredBy: null,
      UserReferredByRaw: null,
      UserTeamName: null,
      UserTrusted: 1,
    });

    const { markUserAsTrusted } = await import("./user");
    const result = await markUserAsTrusted({ referredByUserId: 3, userId: 5 });

    expect(result?.serverError).toContain("already trusted");
  });

  it("marks the user as trusted and sends the trusted email", async () => {
    mockDb.executeTakeFirstOrThrow
      .mockResolvedValueOnce({
        UserEmail: "u@example.com",
        UserFirstName: "U",
        UserID: 5,
        UserName: "U Name",
        UserPlaysSurvivor: 0,
        UserReferredBy: null,
        UserReferredByRaw: null,
        UserTeamName: null,
        UserTrusted: null,
      })
      .mockResolvedValueOnce({});

    const { markUserAsTrusted } = await import("./user");
    const result = await markUserAsTrusted({ referredByUserId: 3, userId: 5 });

    expect(result?.serverError).toBeUndefined();
    expect(sendTrustedEmail).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/admin/users");
  });
});

describe("register", () => {
  beforeEach(resetAllMocks);

  it("throws when the user already exists", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({ UserID: 1 });

    const { register } = await import("./user");
    const result = await register({
      confirmPassword: "password123",
      email: "user@example.com",
      isLogin: false,
      password: "password123",
    });

    expect(result?.serverError).toContain("User already exists");
  });

  it("throws when the email domain has no valid MX record", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);
    mxExists.mockResolvedValue(false);

    const { register } = await import("./user");
    const result = await register({
      confirmPassword: "password123",
      email: "user@bad-domain.com",
      isLogin: false,
      password: "password123",
    });

    expect(result?.serverError).toContain("not valid");
  });

  it("throws when the password is too weak", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);
    verifyPasswordStrength.mockResolvedValue(false);

    const { register } = await import("./user");
    const result = await register({
      confirmPassword: "password123",
      email: "user@example.com",
      isLogin: false,
      password: "password123",
    });

    expect(result?.serverError).toContain("at least 8 characters");
  });

  it("creates the user and a session on success", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ insertId: 42 });
    cookiesGet.mockReturnValue({ value: "" });

    const { register } = await import("./user");
    const result = await register({
      confirmPassword: "password123",
      email: "user@example.com",
      isLogin: false,
      password: "password123",
    });

    expect(result?.serverError).toBeUndefined();
    expect(createSession).toHaveBeenCalledWith("raw-token", 42);
    expect(verifyRegistrationEligibility).toHaveBeenCalled();
  });
});

describe("removeUserFromAdmin", () => {
  beforeEach(() => {
    resetAllMocks();
    getCurrentSession.mockResolvedValue({ session: { id: "s1" }, user: ADMIN_USER });
  });

  it("throws when trying to delete a trusted user", async () => {
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ UserEmail: "u@example.com", UserTrusted: 1 });

    const { removeUserFromAdmin } = await import("./user");
    const result = await removeUserFromAdmin({ userID: 5 });

    expect(result?.serverError).toContain("Cannot delete a trusted user");
  });

  it("deletes an untrusted user", async () => {
    mockDb.executeTakeFirstOrThrow
      .mockResolvedValueOnce({ UserEmail: "u@example.com", UserTrusted: 0 })
      .mockResolvedValueOnce({});

    const { removeUserFromAdmin } = await import("./user");
    const result = await removeUserFromAdmin({ userID: 5 });

    expect(result?.serverError).toBeUndefined();
    expect(revalidatePath).toHaveBeenCalledWith("/admin/users");
  });
});

describe("sendPasswordResetOTP", () => {
  beforeEach(resetAllMocks);

  it("returns Success silently when no user matches the email", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

    const { sendPasswordResetOTP } = await import("./user");
    const result = await sendPasswordResetOTP({ email: "nobody@example.com" });

    expect(result?.serverError).toBeUndefined();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("stores a verification request and emails the OTP when the user exists", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({
      UserEmail: "user@example.com",
      UserFirstName: "Brian",
      UserID: 1,
    });

    const { sendPasswordResetOTP } = await import("./user");
    const result = await sendPasswordResetOTP({ email: "user@example.com" });

    expect(result?.serverError).toBeUndefined();
    expect(sendPasswordResetEmail).toHaveBeenCalled();
  });
});

describe("verifyOTPAndResetPassword", () => {
  beforeEach(resetAllMocks);

  const BASE_INPUT = {
    confirmPassword: "newpassword1",
    email: "user@example.com",
    newPassword: "newpassword1",
    otp: "123456",
  };

  it("throws when no verification request exists", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

    const { verifyOTPAndResetPassword } = await import("./user");
    const result = await verifyOTPAndResetPassword(BASE_INPUT);

    expect(result?.serverError).toContain("Invalid or expired verification code");
  });

  it("throws and deletes the request when the OTP has expired", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({
      VerificationRequestExpires: new Date(Date.now() - 1000),
      VerificationRequestToken: "123456",
    });

    const { verifyOTPAndResetPassword } = await import("./user");
    const result = await verifyOTPAndResetPassword(BASE_INPUT);

    expect(result?.serverError).toContain("expired");
  });

  it("throws when the OTP doesn't match", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({
      VerificationRequestExpires: new Date(Date.now() + 60 * 1000),
      VerificationRequestToken: "654321",
    });

    const { verifyOTPAndResetPassword } = await import("./user");
    const result = await verifyOTPAndResetPassword(BASE_INPUT);

    expect(result?.serverError).toContain("Invalid verification code");
  });

  it("throws when the new password is too weak", async () => {
    mockDb.executeTakeFirst
      .mockResolvedValueOnce({
        VerificationRequestExpires: new Date(Date.now() + 60 * 1000),
        VerificationRequestToken: "123456",
      })
      .mockResolvedValueOnce({ UserID: 1 });
    verifyPasswordStrength.mockResolvedValue(false);

    const { verifyOTPAndResetPassword } = await import("./user");
    const result = await verifyOTPAndResetPassword(BASE_INPUT);

    expect(result?.serverError).toContain("at least 8 characters");
  });

  it("resets the password and creates a new session on success", async () => {
    mockDb.executeTakeFirst
      .mockResolvedValueOnce({
        VerificationRequestExpires: new Date(Date.now() + 60 * 1000),
        VerificationRequestToken: "123456",
      })
      .mockResolvedValueOnce({ UserID: 1 });

    const { verifyOTPAndResetPassword } = await import("./user");
    const result = await verifyOTPAndResetPassword(BASE_INPUT);

    expect(result?.serverError).toBeUndefined();
    expect(hashPassword).toHaveBeenCalledWith("newpassword1");
    expect(createSession).toHaveBeenCalledWith("raw-token", 1);
  });
});
