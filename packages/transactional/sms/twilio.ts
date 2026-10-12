import { env } from "../src/env";

const TWILIO_TIMEOUT_MS = 10_000;

type TwilioErrorBody = {
  code?: number;
  message?: string;
  more_info?: string;
  status?: number;
};

export class TwilioError extends Error {
  code: number | undefined;
  details: string | undefined;
  moreInfo: string | undefined;
  status: number;

  constructor({ body, status }: { body: TwilioErrorBody | null; status: number }) {
    super(body?.message ?? `Twilio request failed with HTTP ${status}`);
    this.name = "TwilioError";
    this.code = body?.code;
    this.details = body?.message;
    this.moreInfo = body?.more_info;
    this.status = status;
  }
}

const readErrorBody = async (response: Response): Promise<TwilioErrorBody | null> => {
  try {
    const body: unknown = await response.json();

    return typeof body === "object" ? (body as TwilioErrorBody | null) : null;
  } catch {
    return null;
  }
};

export const sendTwilioMessage = async ({
  body,
  from,
  to,
}: {
  body: string;
  from: string;
  to: string;
}): Promise<void> => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = env;
  const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
    body: new URLSearchParams({ Body: body, From: from, To: to }),
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
    signal: AbortSignal.timeout(TWILIO_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new TwilioError({ body: await readErrorBody(response), status: response.status });
  }
};
