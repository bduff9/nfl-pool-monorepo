import { describe, expect, it } from "vitest";

import { getPartialFailureDescription } from "./partialFailure";

describe("getPartialFailureDescription", () => {
  it.each([undefined, null, {}, { failedCount: 0, totalCount: 3 }, { failedCount: "2" }, { failedCount: -1 }])(
    "returns null when nothing failed (%#)",
    (metadata) => {
      expect(getPartialFailureDescription(metadata)).toBeNull();
    },
  );

  it("describes a partial failure", () => {
    expect(getPartialFailureDescription({ failedCount: 2, totalCount: 5 })).toBe(
      "2 of 5 emails failed to send. Check the server logs for details.",
    );
  });
});
