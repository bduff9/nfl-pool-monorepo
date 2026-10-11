import { type RefObject, useEffect } from "react";

import { getScrollDelta } from "../dragAutoScroll";

const getPointerY = (event: MouseEvent | TouchEvent): null | number =>
  "touches" in event ? (event.touches[0]?.clientY ?? null) : event.clientY;

// dnd only auto-scrolls the window, or a scroll container while hovering one of its drop zones, so dragging a point
// toward the edge of the game list wouldn't scroll it. While dragging, scroll the list when the pointer nears an edge.
export const useDragAutoScroll = (scrollerRef: RefObject<HTMLElement | null>, isDragging: boolean): void => {
  useEffect(() => {
    if (!isDragging) {
      return;
    }

    let pointerY: null | number = null;
    let frame = 0;

    const onMove = (event: MouseEvent | TouchEvent): void => {
      pointerY = getPointerY(event);
    };
    const tick = (): void => {
      const scroller = scrollerRef.current;

      if (scroller && pointerY !== null) {
        const { bottom, top } = scroller.getBoundingClientRect();

        scroller.scrollTop += getScrollDelta(pointerY, top, bottom);
      }

      frame = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });
    frame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [isDragging, scrollerRef]);
};
