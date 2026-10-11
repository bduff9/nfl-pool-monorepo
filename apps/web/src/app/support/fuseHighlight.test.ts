import type { SupportContent } from "@nfl-pool-monorepo/db/src";
import type { FuseResult } from "fuse.js";
import type { Selectable } from "kysely";
import { describe, expect, it } from "vitest";

import { getHighlightSource } from "./fuseHighlight";

const makeHit = (matches?: FuseResult<Selectable<SupportContent>>["matches"]) =>
  ({
    item: { SupportContentDescription: "Plain description" },
    matches,
  }) as unknown as FuseResult<Selectable<SupportContent>>;

describe("getHighlightSource", () => {
  it("uses the matching key's value and indices", () => {
    const hit = makeHit([
      { indices: [[0, 4]], key: "SupportContentDescription", value: "Plain match" },
      { indices: [[1, 2]], key: "Other", value: "Other" },
    ]);

    expect(getHighlightSource(hit, "SupportContentDescription")).toEqual({
      indices: [[0, 4]],
      value: "Plain match",
    });
  });

  it("falls back to the item attribute when nothing matches", () => {
    expect(getHighlightSource(makeHit(), "SupportContentDescription")).toEqual({
      indices: undefined,
      value: "Plain description",
    });
  });

  it("falls back to an empty string for a missing attribute", () => {
    expect(getHighlightSource(makeHit([]), "Missing")).toEqual({ indices: undefined, value: "" });
  });
});
