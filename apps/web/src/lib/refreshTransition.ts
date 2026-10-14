import { addTransitionType, startTransition } from "react";

/**
 * Transition type of a refresh of the current page's data (live polling, pull to refresh, coming back to the app). A
 * refresh that changes live data animates it in place (a score rolling, a new play sliding in) while the rest of the
 * page stays in the root snapshot, so the page scrim must stay there too (see globals.css).
 */
export const REFRESH_TRANSITION = "refresh";

type Refreshable = { refresh: () => void };

/** router.refresh() carrying the refresh transition type. Call it inside a transition (startTransition) only. */
export const refreshInTransition = (router: Refreshable): void => {
  addTransitionType(REFRESH_TRANSITION);
  router.refresh();
};

/** router.refresh() in a transition of its own, carrying the refresh transition type */
export const refreshWithTransition = (router: Refreshable): void => {
  startTransition(() => refreshInTransition(router));
};
