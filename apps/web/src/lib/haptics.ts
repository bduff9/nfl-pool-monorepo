const TAP_DURATION_MS = 10;

// A short buzz for picking up and dropping things. Only Android browsers support it; elsewhere this does nothing.
// iOS has no web haptics API, and since iOS 27 even toggling a hidden <input switch> from code plays nothing (tested
// on device), so there is no iOS fallback.
export const hapticTap = (): void => {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(TAP_DURATION_MS);
  }
};
