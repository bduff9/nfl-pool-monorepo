import { type RefObject, useEffect } from "react";

import { createDwellGate, getScrollDelta } from "../dragAutoScroll";

const getPointerY = (event: MouseEvent | TouchEvent): null | number =>
  "touches" in event ? (event.touches[0]?.clientY ?? null) : event.clientY;

// dnd's own auto-scroll is turned off (see PicksBoard): it scrolls the list the moment a point dragged from the bank
// crosses the list's top edge, and only while hovering one of the list's drop zones. Instead, while dragging, scroll the
// list when the pointer rests near an edge.
export const useDragAutoScroll = (scrollerRef: RefObject<HTMLElement | null>, isDragging: boolean): void => {
  useEffect(() => {
    if (!isDragging) {
      return;
    }

    let pointerY: null | number = null;
    let frame = 0;
    const gateDelta = createDwellGate();

    const onMove = (event: MouseEvent | TouchEvent): void => {
      pointerY = getPointerY(event);
    };
    const tick = (now: DOMHighResTimeStamp): void => {
      const scroller = scrollerRef.current;

      if (scroller && pointerY !== null) {
        const { bottom, top } = scroller.getBoundingClientRect();

        scroller.scrollTop += gateDelta(getScrollDelta(pointerY, top, bottom), now);
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
