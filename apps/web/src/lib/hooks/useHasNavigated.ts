import { useSyncExternalStore } from "react";

// Whether the visitor has moved to another URL in this tab without reloading, also marked on the root element as
// data-has-navigated. Charts use it to play their intro animation only on a fresh load: after a client navigation a
// chart that sweeps open inside a moving page looks like it is being redrawn.
let firstUrl: string | undefined;
let navigated = false;

/**
 * Called with the current URL on every render of the app's navigation tracker (see Providers), which renders before the
 * page, so a page mounted by a client navigation already sees true in its first render. Only ever goes from false to
 * true, so nothing that already rendered needs to be told.
 */
export const recordUrl = (url: string): void => {
  if (firstUrl === undefined) {
    firstUrl = url;
  } else if (url !== firstUrl && !navigated) {
    navigated = true;
    // For intro animations done in CSS alone (the progress bars' fill, see globals.css)
    document.documentElement.dataset.hasNavigated = "";
  }
};

const subscribeToNothing = () => () => {};
const getClientSnapshot = () => navigated;
// Server rendering and hydration always see a fresh load
const getServerSnapshot = () => false;

export const useHasNavigated = (): boolean =>
  useSyncExternalStore(subscribeToNothing, getClientSnapshot, getServerSnapshot);
