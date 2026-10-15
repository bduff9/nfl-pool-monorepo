const EDGE_SIZE_PX = 90;
const MAX_SPEED_PX = 16;

// A point dragged from the bank into the list passes through the list's top edge zone on the way, so the pointer has
// to rest in an edge zone this long before the list scrolls
const EDGE_DWELL_MS = 300;

// Scroll speed for a pointer at `pointerY`: 0 in the middle, ramping up to MAX_SPEED_PX at the top edge and at (and past)
// the bottom edge. Above the list is the point bank, so a point picked up there must not scroll the list up.
export const getScrollDelta = (pointerY: number, top: number, bottom: number): number => {
  if (pointerY < top) {
    return 0;
  }

  const intoTopEdge = top + EDGE_SIZE_PX - pointerY;
  const intoBottomEdge = pointerY - (bottom - EDGE_SIZE_PX);

  if (intoTopEdge > 0) {
    return -Math.min(1, intoTopEdge / EDGE_SIZE_PX) * MAX_SPEED_PX;
  }

  if (intoBottomEdge > 0) {
    return Math.min(1, intoBottomEdge / EDGE_SIZE_PX) * MAX_SPEED_PX;
  }

  return 0;
};

// Gates scroll deltas behind the dwell: a delta only passes once the pointer has been in an edge zone (a non-zero delta)
// for EDGE_DWELL_MS, and leaving the zone starts the wait over
export const createDwellGate = (): ((delta: number, now: number) => number) => {
  let edgeSince: null | number = null;

  return (delta, now) => {
    if (delta === 0) {
      edgeSince = null;

      return 0;
    }

    edgeSince ??= now;

    return now - edgeSince >= EDGE_DWELL_MS ? delta : 0;
  };
};
