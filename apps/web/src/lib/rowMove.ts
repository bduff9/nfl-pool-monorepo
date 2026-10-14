/** Transition type of a table re-sorted on the client (the view-all picks "What If" ranks) */
export const REORDER_TRANSITION = "reorder";

/** View transition class of a table row gliding to its new place (see globals.css) */
export const ROW_MOVE = "row-move";

/**
 * The rows (by ID) that glide in a re-sort from oldOrder to newOrder: those whose place changes, where both places are in
 * view. A row's snapshot is not clipped by the table's scroll container, so a row flying into or out of the scrolled-away
 * part would be drawn over the page around it; such a row just appears in (or leaves) its place instead.
 */
export const getGlidingRows = (
  oldOrder: number[],
  newOrder: number[],
  isPlaceInView: (index: number) => boolean,
): Set<number> => {
  const gliding = new Set<number>();

  newOrder.forEach((id, newIndex) => {
    const oldIndex = oldOrder.indexOf(id);

    if (oldIndex !== -1 && oldIndex !== newIndex && isPlaceInView(oldIndex) && isPlaceInView(newIndex)) {
      gliding.add(id);
    }
  });

  return gliding;
};
