import { describe, expect, it, vi } from "vitest";

import { htmlResponse, parseUnsubscribeForm } from "./unsubscribe";

describe("htmlResponse", () => {
  it("returns an html response with the given status", async () => {
    const response = htmlResponse("<h1>Hi</h1>", 418);

    expect(response.status).toBe(418);
    expect(response.headers.get("Content-Type")).toBe("text/html");
    expect(await response.text()).toBe("<h1>Hi</h1>");
  });
});

const buildForm = (entries: Record<string, string | File>): FormData => {
  const formData = new FormData();

  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }

  return formData;
};

describe("parseUnsubscribeForm", () => {
  it.each([{}, { email: "" }, { email: new File([], "a.txt") }])(
    "rejects a missing or non-string email (%#) with 400",
    async (entries) => {
      const verify = vi.fn(() => true);
      const result = parseUnsubscribeForm(buildForm({ ...entries, t: "t" }), verify);

      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(400);
      expect(await (result as Response).text()).toBe("<h1>Please provide a valid email address</h1>");
      expect(verify).not.toHaveBeenCalled();
    },
  );

  it("rejects a missing token with 403 without verifying", async () => {
    const verify = vi.fn(() => true);
    const result = parseUnsubscribeForm(buildForm({ email: "a@b.co" }), verify);

    expect((result as Response).status).toBe(403);
    expect(await (result as Response).text()).toBe("<h1>Please use the unsubscribe link from your email</h1>");
    expect(verify).not.toHaveBeenCalled();
  });

  it("rejects an invalid token with 403", () => {
    const verify = vi.fn(() => false);
    const result = parseUnsubscribeForm(buildForm({ email: "a@b.co", t: "bad" }), verify);

    expect((result as Response).status).toBe(403);
    expect(verify).toHaveBeenCalledWith("a@b.co", "bad");
  });

  it("returns the email for a valid email and token", () => {
    expect(parseUnsubscribeForm(buildForm({ email: "a@b.co", t: "good" }), () => true)).toBe("a@b.co");
  });
});
