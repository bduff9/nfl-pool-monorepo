import { describe, expect, it } from "vitest";

import { parseEspnEventIds } from "./espnEventIds";
import fixture from "./espnScoreboard.fixture.json";

describe("parseEspnEventIds", () => {
  it("maps every game, whatever its state, to its event id by visitor@home short names", () => {
    expect(parseEspnEventIds(fixture)).toEqual({
      "BAL@ATL": "401872993",
      "NYG@WAS": "401872988",
      "PHI@JAC": "401872981",
    });
  });

  it("skips events without both sides", () => {
    const [event] = fixture.events;

    const payload = {
      events: [{ ...event, competitions: [{ competitors: event?.competitions[0]?.competitors.slice(0, 1) }] }],
    };

    expect(parseEspnEventIds(payload)).toEqual({});
  });

  it("throws when the payload shape is unexpected", () => {
    expect(() => parseEspnEventIds({ events: [{ id: 5 }] })).toThrow("ESPN event id schema mismatch");
  });
});
