import { useSyncExternalStore } from "react";

const subscribeToNothing = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * False while server rendering and hydrating, true otherwise. Unlike setting state in an effect, a component mounted
 * by a client navigation gets true in its first render, so values that need the browser (such as the visitor's
 * timezone) are in place in that render, before a view transition captures the page.
 */
export const useIsClient = (): boolean =>
  useSyncExternalStore(subscribeToNothing, getClientSnapshot, getServerSnapshot);
