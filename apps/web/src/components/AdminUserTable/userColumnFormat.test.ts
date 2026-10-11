import { cn } from "@nfl-pool-monorepo/utils/styles";
import { describe, expect, it } from "vitest";

import { formatNotificationChannel, getUserStatusClass } from "./userColumnFormat";

const legacyStatusClass = (status: string | null): string =>
  cn(
    status === "Registered" && "text-green-600",
    status === "Unverified" && "text-red-600",
    status === "Untrusted" && "text-amber-600",
    status === "Verified" && "text-muted-foreground",
  );

describe("getUserStatusClass", () => {
  it.each(["Registered", "Unverified", "Untrusted", "Verified", "Other", "", null, undefined, "constructor"])(
    "matches the original classes for %s",
    (status) => {
      expect(cn(getUserStatusClass(status))).toBe(legacyStatusClass(status ?? null));
    },
  );
});

describe("formatNotificationChannel", () => {
  it("is empty when the channel is off", () => {
    expect(formatNotificationChannel("E", 0, 4)).toBe("");
    expect(formatNotificationChannel("S", null, 4)).toBe("");
  });

  it("includes the hours before when enabled", () => {
    expect(formatNotificationChannel("E", 1, 4)).toBe("E4");
    expect(formatNotificationChannel("S", true, 0)).toBe("S0");
  });

  it("omits missing hours", () => {
    expect(formatNotificationChannel("S", 1, null)).toBe("S");
    expect(formatNotificationChannel("E", 1, undefined)).toBe("E");
  });
});
