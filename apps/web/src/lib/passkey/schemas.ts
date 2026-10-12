import { type } from "arktype";

const clientExtensionResults = type("object");

export const registrationResponseSchema = type({
  "authenticatorAttachment?": "'platform' | 'cross-platform'",
  clientExtensionResults,
  id: "string",
  rawId: "string",
  response: {
    attestationObject: "string",
    "authenticatorData?": "string",
    clientDataJSON: "string",
    "publicKey?": "string",
    "publicKeyAlgorithm?": "number",
    "transports?": "string[]",
  },
  type: "'public-key'",
});

export const authenticationResponseSchema = type({
  "authenticatorAttachment?": "'platform' | 'cross-platform'",
  clientExtensionResults,
  id: "string",
  rawId: "string",
  response: {
    authenticatorData: "string",
    clientDataJSON: "string",
    signature: "string",
    "userHandle?": "string",
  },
  type: "'public-key'",
});

export const renamePasskeySchema = type({
  name: type("string.trim").to("1 <= string <= 100"),
  passkeyId: "number.integer > 0",
});

export const deletePasskeySchema = type({ passkeyId: "number.integer > 0" });
