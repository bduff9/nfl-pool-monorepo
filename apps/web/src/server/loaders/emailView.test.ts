import { describe, expect, it } from "vitest";

import { buildEmailViewLog } from "./emailView";

const now = new Date("2024-01-01T00:00:00Z");
const email = { EmailSubject: "Hello", EmailTo: "a@b.com" };

describe("buildEmailViewLog", () => {
  it("uses the signed-in user's name and id", () => {
    expect(buildEmailViewLog({ id: 5, name: "Pat" }, email, now)).toEqual({
      LogAction: "VIEW_HTML_EMAIL",
      LogAddedBy: "Pat",
      LogMessage: "Pat viewed HTML version of email with subject Hello",
      LogUpdated: now,
      LogUpdatedBy: "Pat",
      UserID: 5,
    });
  });

  it("falls back to the recipient when signed out", () => {
    const log = buildEmailViewLog(null, email, now);

    expect(log.LogAddedBy).toBe("a@b.com");
    expect(log.UserID).toBeUndefined();
  });

  it("falls back to Unknown User when there is no email", () => {
    const log = buildEmailViewLog(null, undefined, now);

    expect(log.LogUpdatedBy).toBe("Unknown User");
    expect(log.LogMessage).toBe("Unknown User viewed HTML version of email with subject undefined");
  });
});
