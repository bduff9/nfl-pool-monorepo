import { describe, expect, it } from "vitest";

import {
  defaultPasskeyName,
  encodePublicKey,
  serializeTransports,
  toExcludeCredential,
  toWebAuthnCredential,
} from "./mapping";

describe("toWebAuthnCredential", () => {
  it("maps a stored row to a simplewebauthn credential, round-tripping the public key", () => {
    const publicKey = new Uint8Array([250, 251, 252, 0, 1, 2]);
    const credential = toWebAuthnCredential({
      PasskeyCounter: 12,
      PasskeyCredentialID: "cred",
      PasskeyPublicKey: encodePublicKey(publicKey),
      PasskeyTransports: "internal,hybrid",
    });

    expect(credential).toEqual({ counter: 12, id: "cred", publicKey, transports: ["internal", "hybrid"] });
  });

  it("maps missing transports to an empty list", () => {
    const credential = toWebAuthnCredential({
      PasskeyCounter: 0,
      PasskeyCredentialID: "cred",
      PasskeyPublicKey: "AQID",
      PasskeyTransports: null,
    });

    expect(credential.transports).toEqual([]);
  });
});

describe("toExcludeCredential", () => {
  it("returns the credential id and its transports", () => {
    expect(toExcludeCredential({ PasskeyCredentialID: "cred", PasskeyTransports: "usb" })).toEqual({
      id: "cred",
      transports: ["usb"],
    });
  });
});

describe("serializeTransports", () => {
  it("joins transports and stores none as null", () => {
    expect(serializeTransports(["internal", "hybrid"])).toBe("internal,hybrid");
    expect(serializeTransports([])).toBeNull();
    expect(serializeTransports(undefined)).toBeNull();
  });
});

describe("defaultPasskeyName", () => {
  it.each([
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", "multiDevice", "iPhone passkey"],
    ["Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)", "multiDevice", "iPad passkey"],
    ["Mozilla/5.0 (Linux; Android 15; Pixel 9)", "multiDevice", "Android passkey"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", "multiDevice", "Mac passkey"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "multiDevice", "Windows passkey"],
    [null, "singleDevice", "Security key"],
    ["curl/8", "multiDevice", "Passkey"],
  ])("names %s (%s) as %s", (userAgent, deviceType, expected) => {
    expect(defaultPasskeyName(userAgent, deviceType)).toBe(expected);
  });
});
