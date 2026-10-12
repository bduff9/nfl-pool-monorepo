import { startAuthentication, startRegistration } from "@simplewebauthn/browser";

import {
  getAuthenticationOptions,
  getRegistrationOptions,
  verifyAuthentication,
  verifyRegistration,
} from "@/server/actions/passkey";
import "client-only";

export type PasskeyFlowResult =
  | { status: "success"; redirectTo?: string }
  | { status: "cancelled" }
  | { status: "error"; message: string };

type ActionFailure = { serverError?: string | undefined };

const GENERIC_MESSAGE = "Something went wrong with your passkey. Please try again.";
const ALREADY_REGISTERED_MESSAGE = "This device already has a passkey saved for your account.";

const hasName = (error: unknown): error is { name: string } =>
  typeof error === "object" && error !== null && "name" in error;

const hasCode = (error: unknown, code: string): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === code;

/** The user dismissing the browser's passkey prompt (or it timing out) is not an error worth surfacing. */
const isPasskeyCancellation = (error: unknown): boolean =>
  hasCode(error, "ERROR_CEREMONY_ABORTED") ||
  (hasName(error) && ["AbortError", "NotAllowedError"].includes(error.name));

const toPasskeyFailure = (error: unknown): PasskeyFlowResult => {
  if (isPasskeyCancellation(error)) {
    return { status: "cancelled" };
  }

  const message = hasCode(error, "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED")
    ? ALREADY_REGISTERED_MESSAGE
    : GENERIC_MESSAGE;

  return { message, status: "error" };
};

const actionFailure = (result: ActionFailure | undefined): PasskeyFlowResult => ({
  message: result?.serverError ?? GENERIC_MESSAGE,
  status: "error",
});

export const registerPasskey = async (): Promise<PasskeyFlowResult> => {
  const options = await getRegistrationOptions();

  if (!options?.data) {
    return actionFailure(options);
  }

  try {
    const response = await startRegistration({ optionsJSON: options.data });
    const verified = await verifyRegistration({ response });

    return verified?.data ? { status: "success" } : actionFailure(verified);
  } catch (error) {
    return toPasskeyFailure(error);
  }
};

export const signInWithPasskey = async (): Promise<PasskeyFlowResult> => {
  const options = await getAuthenticationOptions();

  if (!options?.data) {
    return actionFailure(options);
  }

  try {
    const response = await startAuthentication({ optionsJSON: options.data });
    const verified = await verifyAuthentication({ response });
    const redirectTo = verified?.data?.metadata.redirectTo;

    return typeof redirectTo === "string" ? { redirectTo, status: "success" } : actionFailure(verified);
  } catch (error) {
    return toPasskeyFailure(error);
  }
};
