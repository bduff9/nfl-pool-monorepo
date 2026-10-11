export const PULL_THRESHOLD_PX = 70;
const MAX_PULL_PX = 110;
const RESISTANCE = 0.5;

// Pages where a downward drag at the top already means something else (dragging a point out of the bank)
const PULL_DISABLED_PATHS = ["/picks/set"];

// Selectors for things that scroll or take drags themselves
const SELF_SCROLLING =
  '[role="dialog"], [role="listbox"], [data-radix-popper-content-wrapper], [data-rfd-draggable-id]';

// How far the indicator follows the finger: the drag slowed by resistance, so it feels elastic, and capped
const getPullDistance = (dragPx: number): number => Math.min(MAX_PULL_PX, Math.max(0, dragPx) * RESISTANCE);

export const isPullEnabledOn = (pathname: string): boolean =>
  !PULL_DISABLED_PATHS.some((path) => pathname.startsWith(path));

// The parts of a DOM element a pull needs to look at, so this can be tested without a DOM
type PullTarget = { closest: (selector: string) => unknown; parentElement: PullTarget | null; scrollTop: number };

// A pull only starts when nothing underneath the finger could scroll up or handle the drag itself
const canStartPull = (target: PullTarget | null, pageScrollY: number): boolean => {
  if (pageScrollY > 0 || !target || target.closest(SELF_SCROLLING)) {
    return false;
  }

  for (let element: PullTarget | null = target; element; element = element.parentElement) {
    if (element.scrollTop > 0) {
      return false;
    }
  }

  return true;
};

type TouchPoint = { clientY: number };

// Where a touch that just began would start pulling from, or null when it must not pull (several fingers, or something
// underneath that scrolls or takes the drag)
export const getPullStart = (
  touches: ArrayLike<TouchPoint>,
  target: PullTarget | null,
  pageScrollY: number,
): null | number => (touches.length === 1 && canStartPull(target, pageScrollY) ? (touches[0]?.clientY ?? null) : null);

// The pull state after a finger moved: the pull's start (dropped once the page scrolls instead) and how far to show
export const getPullUpdate = (
  startY: number,
  touchY: number,
  pageScrollY: number,
): { distance: number; startY: null | number } =>
  pageScrollY > 0 ? { distance: 0, startY: null } : { distance: getPullDistance(touchY - startY), startY };

export const hasReachedThreshold = (distance: number): boolean => distance >= PULL_THRESHOLD_PX;
