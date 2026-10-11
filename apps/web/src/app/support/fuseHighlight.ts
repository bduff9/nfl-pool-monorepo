import type { SupportContent } from "@nfl-pool-monorepo/db/src";
import type { FuseResult } from "fuse.js";
import type { Selectable } from "kysely";

type SupportHit = FuseResult<Selectable<SupportContent>>;

const resolveAttribute = (item: Selectable<SupportContent>, key: string): unknown =>
  key.split(".").reduce<unknown>((prev, curr) => {
    if (prev && typeof prev === "object" && curr in prev) {
      return (prev as Record<string, unknown>)[curr];
    }

    return undefined;
  }, item);

const findMatch = (hit: SupportHit, attribute: string) =>
  typeof hit.item === "string" ? hit.matches?.[0] : hit.matches?.find((m) => m.key === attribute);

const getFallback = (hit: SupportHit, attribute: string) =>
  typeof hit.item === "string" ? hit.item : String(resolveAttribute(hit.item, attribute) ?? "");

export const getHighlightSource = (hit: SupportHit, attribute: string) => {
  const matches = findMatch(hit, attribute);

  return {
    indices: matches?.indices ? ([...matches.indices] as [number, number][]) : undefined,
    value: matches?.value || getFallback(hit, attribute),
  };
};
