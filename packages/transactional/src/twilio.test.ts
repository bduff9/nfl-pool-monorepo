import { afterEach, describe, expect, it, vi } from "vitest";

import { sendTwilioMessage, TwilioError } from "../sms/twilio";

vi.mock("./env", () => ({ env: { TWILIO_ACCOUNT_SID: "ACtest", TWILIO_AUTH_TOKEN: "secret" } }));

const fetchMock = vi.fn();

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" }, status });

const catchError = async (): Promise<unknown> => {
  try {
    await sendTwilioMessage({ body: "hi", from: "+15550001111", to: "+15552223333" });
  } catch (error) {
    return error;
  }

  return null;
};

describe("sendTwilioMessage", () => {
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("posts a form-encoded message with basic auth", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValueOnce(jsonResponse({ sid: "SM1" }, 201));

    await sendTwilioMessage({ body: "hi", from: "+15550001111", to: "+15552223333" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe("https://api.twilio.com/2010-04-01/Accounts/ACtest/Messages.json");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      Authorization: `Basic ${Buffer.from("ACtest:secret").toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);

    const form = init.body as URLSearchParams;

    expect(form.get("Body")).toBe("hi");
    expect(form.get("From")).toBe("+15550001111");
    expect(form.get("To")).toBe("+15552223333");
  });

  it("throws a TwilioError carrying the Twilio error code on opt-out", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { code: 21_610, message: "Attempt to send to unsubscribed recipient", more_info: "https://x", status: 400 },
        400,
      ),
    );

    const error = await catchError();

    expect(error).toBeInstanceOf(TwilioError);
    expect(error).toMatchObject({
      code: 21_610,
      details: "Attempt to send to unsubscribed recipient",
      message: "Attempt to send to unsubscribed recipient",
      moreInfo: "https://x",
      status: 400,
    });
  });

  it("throws an error with the HTTP status when the body is not JSON", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValueOnce(new Response("Bad Gateway", { status: 502 }));

    const error = await catchError();

    expect(error).toBeInstanceOf(TwilioError);
    expect(error).toMatchObject({ code: undefined, message: "Twilio request failed with HTTP 502", status: 502 });
  });
});
