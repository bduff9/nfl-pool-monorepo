export type WakeLockAction = "acquire" | "release" | "none";

/**
 * Decides what the screen wake lock should do given the current state.
 * The browser drops the lock itself whenever the page is hidden, so acquiring is only
 * worthwhile while visible, and a held lock is released as soon as no game is live.
 */
export const getWakeLockAction = (state: {
  isHeld: boolean;
  isLive: boolean;
  isSupported: boolean;
  isVisible: boolean;
}): WakeLockAction => {
  if (!state.isSupported) {
    return "none";
  }

  if (state.isLive && state.isVisible) {
    return state.isHeld ? "none" : "acquire";
  }

  return state.isHeld ? "release" : "none";
};
