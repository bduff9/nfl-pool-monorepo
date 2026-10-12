import { env } from "@/lib/env";
import "server-only";

const PASSKEY_RP_NAME = "NFL Confidence Pool";

type PasskeyConfig = {
  /** The WebAuthn origin credentials are scoped to, e.g. "https://example.com" or "http://localhost:3000". */
  origin: string;
  rpID: string;
  rpName: string;
};

const derivePasskeyConfig = (siteUrl: string): PasskeyConfig => {
  const { hostname, origin } = new URL(siteUrl);

  return { origin, rpID: hostname, rpName: PASSKEY_RP_NAME };
};

export const getPasskeyConfig = (): PasskeyConfig => derivePasskeyConfig(env.NEXT_PUBLIC_SITE_URL);
