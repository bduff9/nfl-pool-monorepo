import { type } from "arktype";
import { describe, expect, it } from "vitest";

import {
  autoPickSchema,
  editProfileSchema,
  finishRegistrationSchema,
  loginSchema,
  makeSurvivorPickSchema,
  payoutsSchema,
  setMyPickSchema,
  updateMyTiebreakerScoreSchema,
  validateMyPicksSchema,
  verifyOtpSchema,
} from "./validation";

const isError = (result: unknown): boolean => result instanceof type.errors;

describe("loginSchema", () => {
  it("accepts a valid login", () => {
    const result = loginSchema({ email: "test@example.com", isLogin: true, password: "123456" });
    expect(isError(result)).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema({ email: "not-an-email", isLogin: true, password: "123456" });
    expect(isError(result)).toBe(true);
  });

  it("rejects a password shorter than 6 characters", () => {
    const result = loginSchema({ email: "test@example.com", isLogin: true, password: "12345" });
    expect(isError(result)).toBe(true);
  });

  it("accepts signup with matching passwords", () => {
    const result = loginSchema({
      confirmPassword: "password123",
      email: "test@example.com",
      isLogin: false,
      password: "password123",
    });
    expect(isError(result)).toBe(false);
  });

  it("rejects signup with mismatched passwords", () => {
    const result = loginSchema({
      confirmPassword: "different",
      email: "test@example.com",
      isLogin: false,
      password: "password123",
    });
    expect(isError(result)).toBe(true);
  });

  it("allows missing confirmPassword on login", () => {
    const result = loginSchema({ email: "test@example.com", isLogin: true, password: "abcdef" });
    expect(isError(result)).toBe(false);
  });
});

describe("setMyPickSchema", () => {
  it("accepts a valid pick", () => {
    const result = setMyPickSchema({ gameID: 101, points: 5, teamID: 10, week: 1 });
    expect(isError(result)).toBe(false);
  });

  it("accepts null gameID and teamID (clearing a pick)", () => {
    const result = setMyPickSchema({ gameID: null, points: 1, teamID: null, week: 1 });
    expect(isError(result)).toBe(false);
  });

  it("rejects points outside 1-16 range", () => {
    expect(isError(setMyPickSchema({ gameID: 101, points: 0, teamID: 10, week: 1 }))).toBe(true);
    expect(isError(setMyPickSchema({ gameID: 101, points: 17, teamID: 10, week: 1 }))).toBe(true);
  });

  it("rejects invalid week numbers", () => {
    expect(isError(setMyPickSchema({ gameID: 101, points: 5, teamID: 10, week: 0 }))).toBe(true);
    expect(isError(setMyPickSchema({ gameID: 101, points: 5, teamID: 10, week: 19 }))).toBe(true);
  });

  it("rejects gameID outside bounds", () => {
    expect(isError(setMyPickSchema({ gameID: 100, points: 5, teamID: 10, week: 1 }))).toBe(true);
    expect(isError(setMyPickSchema({ gameID: 1817, points: 5, teamID: 10, week: 1 }))).toBe(true);
  });
});

describe("autoPickSchema", () => {
  it("accepts valid auto pick strategies", () => {
    expect(isError(autoPickSchema({ type: "Home", week: 1 }))).toBe(false);
    expect(isError(autoPickSchema({ type: "Away", week: 1 }))).toBe(false);
    expect(isError(autoPickSchema({ type: "Random", week: 1 }))).toBe(false);
  });

  it("rejects an invalid strategy", () => {
    expect(isError(autoPickSchema({ type: "Invalid", week: 1 }))).toBe(true);
  });
});

describe("makeSurvivorPickSchema", () => {
  it("accepts a valid survivor pick", () => {
    const result = makeSurvivorPickSchema({ gameID: 101, teamID: 5, week: 3 });
    expect(isError(result)).toBe(false);
  });

  it("accepts null teamID (clearing a survivor pick)", () => {
    const result = makeSurvivorPickSchema({ gameID: 101, teamID: null, week: 3 });
    expect(isError(result)).toBe(false);
  });

  it("rejects null gameID (gameID is required for survivor picks)", () => {
    const result = makeSurvivorPickSchema({ gameID: null, teamID: 5, week: 3 });
    expect(isError(result)).toBe(true);
  });
});

describe("updateMyTiebreakerScoreSchema", () => {
  it("accepts a valid score >= 2", () => {
    expect(isError(updateMyTiebreakerScoreSchema({ score: 42, week: 1 }))).toBe(false);
    expect(isError(updateMyTiebreakerScoreSchema({ score: 2, week: 18 }))).toBe(false);
  });

  it("rejects scores below 2", () => {
    expect(isError(updateMyTiebreakerScoreSchema({ score: 1, week: 1 }))).toBe(true);
    expect(isError(updateMyTiebreakerScoreSchema({ score: 0, week: 1 }))).toBe(true);
  });

  it("rejects non-integer scores", () => {
    expect(isError(updateMyTiebreakerScoreSchema({ score: 42.5, week: 1 }))).toBe(true);
  });
});

describe("validateMyPicksSchema", () => {
  it("accepts valid picks validation data", () => {
    const result = validateMyPicksSchema({ lastScore: 0, unused: [1, 2, 3], week: 5 });
    expect(isError(result)).toBe(false);
  });

  it("rejects unused points outside 1-16", () => {
    expect(isError(validateMyPicksSchema({ lastScore: 0, unused: [0], week: 5 }))).toBe(true);
    expect(isError(validateMyPicksSchema({ lastScore: 0, unused: [17], week: 5 }))).toBe(true);
  });

  it("rejects negative lastScore", () => {
    expect(isError(validateMyPicksSchema({ lastScore: -1, unused: [1], week: 5 }))).toBe(true);
  });
});

describe("payoutsSchema", () => {
  it("accepts valid payout structure", () => {
    const result = payoutsSchema({
      overall1stPrize: 500,
      overall2ndPrize: 300,
      overall3rdPrize: 200,
      survivor1stPrize: 150,
      survivor2ndPrize: 100,
      weekly1stPrize: 50,
      weekly2ndPrize: 25,
    });
    expect(isError(result)).toBe(false);
  });

  it("coerces string numbers to integers", () => {
    const result = payoutsSchema({
      overall1stPrize: "500",
      overall2ndPrize: "300",
      overall3rdPrize: "200",
      survivor1stPrize: "150",
      survivor2ndPrize: "100",
      weekly1stPrize: "50",
      weekly2ndPrize: "25",
    });
    expect(isError(result)).toBe(false);
    if (!(result instanceof type.errors)) {
      expect(result.overall1stPrize).toBe(500);
    }
  });

  it("rejects zero or negative values", () => {
    const result = payoutsSchema({
      overall1stPrize: 0,
      overall2ndPrize: 300,
      overall3rdPrize: 200,
      survivor1stPrize: 150,
      survivor2ndPrize: 100,
      weekly1stPrize: 50,
      weekly2ndPrize: 25,
    });
    expect(isError(result)).toBe(true);
  });
});

describe("verifyOtpSchema", () => {
  const validOtp = {
    confirmPassword: "password1",
    email: "user@example.com",
    newPassword: "password1",
    otp: "123456",
  };

  it("accepts a valid OTP verification", () => {
    expect(isError(verifyOtpSchema(validOtp))).toBe(false);
  });

  it("rejects OTP that is not 6 digits", () => {
    expect(isError(verifyOtpSchema({ ...validOtp, otp: "12345" }))).toBe(true);
    expect(isError(verifyOtpSchema({ ...validOtp, otp: "1234567" }))).toBe(true);
  });

  it("rejects OTP with non-numeric characters", () => {
    expect(isError(verifyOtpSchema({ ...validOtp, otp: "12345a" }))).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    expect(isError(verifyOtpSchema({ ...validOtp, confirmPassword: "different" }))).toBe(true);
  });

  it("rejects passwords shorter than 8 characters", () => {
    expect(isError(verifyOtpSchema({ ...validOtp, confirmPassword: "short", newPassword: "short" }))).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(isError(verifyOtpSchema({ ...validOtp, email: "not-email" }))).toBe(true);
  });
});

describe("editProfileSchema", () => {
  const validProfile = {
    notifications: [],
    UserAutoPickStrategy: "Home" as const,
    UserAutoPicksLeft: 3,
    UserEmail: "user@example.com",
    UserFirstName: "Brian",
    UserLastName: "Duffey",
    UserPaymentAccount: "user@paypal.com",
    UserPaymentType: "Paypal" as const,
    UserPhone: "",
    UserTeamName: "My Team",
  };

  it("accepts a valid profile", () => {
    expect(isError(editProfileSchema(validProfile))).toBe(false);
  });

  it("rejects first name shorter than 2 chars after trimming", () => {
    expect(isError(editProfileSchema({ ...validProfile, UserFirstName: "B" }))).toBe(true);
    expect(isError(editProfileSchema({ ...validProfile, UserFirstName: "  B  " }))).toBe(true);
  });

  it("rejects last name shorter than 2 chars after trimming", () => {
    expect(isError(editProfileSchema({ ...validProfile, UserLastName: "D" }))).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(isError(editProfileSchema({ ...validProfile, UserEmail: "bad" }))).toBe(true);
  });

  it("rejects Zelle payment with a username (requires email or phone)", () => {
    expect(
      isError(
        editProfileSchema({
          ...validProfile,
          UserPaymentAccount: "myusername",
          UserPaymentType: "Zelle",
        }),
      ),
    ).toBe(true);
  });

  it("accepts Zelle payment with an email", () => {
    expect(
      isError(
        editProfileSchema({
          ...validProfile,
          UserPaymentAccount: "pay@example.com",
          UserPaymentType: "Zelle",
        }),
      ),
    ).toBe(false);
  });

  it("accepts Venmo/Paypal with a username", () => {
    expect(
      isError(
        editProfileSchema({
          ...validProfile,
          UserPaymentAccount: "my-username",
          UserPaymentType: "Venmo",
        }),
      ),
    ).toBe(false);
  });

  it("rejects payment account shorter than 2 chars", () => {
    expect(isError(editProfileSchema({ ...validProfile, UserPaymentAccount: "x" }))).toBe(true);
  });
});

describe("finishRegistrationSchema", () => {
  const validReg = {
    UserEmail: "new@example.com",
    UserFirstName: "Jane",
    UserLastName: "Smith",
    UserName: "janesmith",
    UserPaymentAccount: "jane@paypal.com",
    UserPaymentType: "Paypal" as const,
    UserPlaysSurvivor: true,
    UserReferredByRaw: "Brian Duffey",
    UserTeamName: "Team Jane",
  };

  it("accepts a valid registration", () => {
    expect(isError(finishRegistrationSchema(validReg))).toBe(false);
  });

  it("rejects referral name without a space (must be 'first last')", () => {
    expect(isError(finishRegistrationSchema({ ...validReg, UserReferredByRaw: "Brian" }))).toBe(true);
  });

  it("rejects short first or last name", () => {
    expect(isError(finishRegistrationSchema({ ...validReg, UserFirstName: "J" }))).toBe(true);
    expect(isError(finishRegistrationSchema({ ...validReg, UserLastName: "S" }))).toBe(true);
  });

  it("rejects short username", () => {
    expect(isError(finishRegistrationSchema({ ...validReg, UserName: "j" }))).toBe(true);
  });
});
