const EDGE_SIZE_PX = 90;
const MAX_SPEED_PX = 16;

// Scroll speed for a pointer at `pointerY`: 0 in the middle, ramping up to MAX_SPEED_PX at (and past) either edge
export const getScrollDelta = (pointerY: number, top: number, bottom: number): number => {
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
