const TAP_DURATION_MS = 10;

// A short buzz for picking up and dropping things. Only Android browsers support it; elsewhere this does nothing.
export const hapticTap = (): void => {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(TAP_DURATION_MS);
  }
};
