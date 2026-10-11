import { describe, expect, it } from "vitest";

import { formatError } from "./auth.client";

describe("formatError", () => {
  it.each([
    ["EmailSignin", "Something went wrong with the email login attempt, please try again later or contact an admin"],
    ["InvalidEmail", "It looks like your email is not valid, please double check it and try again"],
    ["LatePayment", "Your entry fee is past due, please pay immediately to regain access and avoid losing any points"],
    ["MissingSystemProperty", "System error, please contact an administrator"],
    ["NotAllowed", "Your account has been blocked.  Please reach out to an administrator to resolve."],
    [
      "OAuthAccountNotLinked",
      "It looks like you haven't linked your account yet, please sign in using the previous method and then link this account to be able to use it to sign in",
    ],
    ["RegistrationOver", "Sorry, registration is over for this year, please try again next season!"],
  ])("maps %s to its message", (code, message) => {
    expect(formatError(code)).toBe(message);
  });

  it.each([["Unknown"], [""], [undefined], [null], [42], [{}]])("returns an empty string for %j", (value) => {
    expect(formatError(value)).toBe("");
  });
});
