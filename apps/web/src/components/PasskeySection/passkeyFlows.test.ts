import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getAuthenticationOptions,
  getRegistrationOptions,
  startAuthentication,
  startRegistration,
  verifyAuthentication,
  verifyRegistration,
} = vi.hoisted(() => ({
  getAuthenticationOptions: vi.fn(),
  getRegistrationOptions: vi.fn(),
  startAuthentication: vi.fn(),
  startRegistration: vi.fn(),
  verifyAuthentication: vi.fn(),
  verifyRegistration: vi.fn(),
}));

vi.mock("@simplewebauthn/browser", () => ({ startAuthentication, startRegistration }));
vi.mock("@/server/actions/passkey", () => ({
  getAuthenticationOptions,
  getRegistrationOptions,
  verifyAuthentication,
  verifyRegistration,
}));

import { registerPasskey, signInWithPasskey } from "./passkeyFlows";

const cancelled = Object.assign(new Error("The operation either timed out or was not allowed"), {
  name: "NotAllowedError",
});

beforeEach(() => {
  for (const mock of [
    startRegistration,
    startAuthentication,
    getRegistrationOptions,
    verifyRegistration,
    getAuthenticationOptions,
    verifyAuthentication,
  ]) {
    mock.mockReset();
  }
});

describe("failure classification", () => {
  const failWith = async (error: unknown) => {
    getAuthenticationOptions.mockResolvedValue({ data: { challenge: "c" } });
    startAuthentication.mockRejectedValue(error);

    return signInWithPasskey();
  };

  it("treats dismissing the prompt or aborting the ceremony as a cancellation", async () => {
    expect(await failWith(cancelled)).toEqual({ status: "cancelled" });
    expect(await failWith(Object.assign(new Error("x"), { code: "ERROR_CEREMONY_ABORTED" }))).toEqual({
      status: "cancelled",
    });
  });

  it("returns a friendly message for an already registered authenticator", async () => {
    expect(
      await failWith(Object.assign(new Error("x"), { code: "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED" })),
    ).toEqual({
      message: "This device already has a passkey saved for your account.",
      status: "error",
    });
  });

  it("returns a generic message for anything else", async () => {
    expect(await failWith(new Error("boom"))).toEqual({
      message: "Something went wrong with your passkey. Please try again.",
      status: "error",
    });
    expect(await failWith("nope")).toMatchObject({ status: "error" });
  });
});

describe("registerPasskey", () => {
  it("registers a passkey end to end", async () => {
    getRegistrationOptions.mockResolvedValue({ data: { challenge: "c" } });
    startRegistration.mockResolvedValue({ id: "cred" });
    verifyRegistration.mockResolvedValue({ data: { status: "Success" } });

    expect(await registerPasskey()).toEqual({ status: "success" });
    expect(startRegistration).toHaveBeenCalledWith({ optionsJSON: { challenge: "c" } });
    expect(verifyRegistration).toHaveBeenCalledWith({ response: { id: "cred" } });
  });

  it("does not report an error when the user cancels", async () => {
    getRegistrationOptions.mockResolvedValue({ data: { challenge: "c" } });
    startRegistration.mockRejectedValue(cancelled);

    expect(await registerPasskey()).toEqual({ status: "cancelled" });
    expect(verifyRegistration).not.toHaveBeenCalled();
  });

  it("surfaces server errors", async () => {
    getRegistrationOptions.mockResolvedValue({ serverError: "Too many passkey attempts. Please try again later." });

    expect(await registerPasskey()).toEqual({
      message: "Too many passkey attempts. Please try again later.",
      status: "error",
    });
  });
});

describe("signInWithPasskey", () => {
  it("returns the redirect from the server", async () => {
    getAuthenticationOptions.mockResolvedValue({ data: { challenge: "c" } });
    startAuthentication.mockResolvedValue({ id: "cred" });
    verifyAuthentication.mockResolvedValue({ data: { metadata: { redirectTo: "/picks" }, status: "Success" } });

    expect(await signInWithPasskey()).toEqual({ redirectTo: "/picks", status: "success" });
  });

  it("does not report an error when the user cancels", async () => {
    getAuthenticationOptions.mockResolvedValue({ data: { challenge: "c" } });
    startAuthentication.mockRejectedValue(cancelled);

    expect(await signInWithPasskey()).toEqual({ status: "cancelled" });
  });

  it("surfaces verification errors from the server", async () => {
    getAuthenticationOptions.mockResolvedValue({ data: { challenge: "c" } });
    startAuthentication.mockResolvedValue({ id: "cred" });
    verifyAuthentication.mockResolvedValue({ serverError: "We don't recognize that passkey." });

    expect(await signInWithPasskey()).toEqual({ message: "We don't recognize that passkey.", status: "error" });
  });
});
