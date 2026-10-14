/**
 * Why a confirmation dialog closed. Callers hear about a cancel only once the dialog has animated out, from Radix's
 * onCloseAutoFocus, but Radix also fires that whenever its focus scope unmounts (React StrictMode's extra mount and
 * unmount in development, a page Next hides), so the cancel itself is recorded here from what the user did: the Cancel
 * button, Escape or a tap outside. Accepting wins over a cancel made while the action ran.
 */
type CloseIntent = {
  accept: () => void;
  cancel: () => void;
  open: () => void;
  /** Whether the user cancelled since the dialog opened; true at most once per cancel. */
  takeCancel: () => boolean;
};

export const createCloseIntent = (): CloseIntent => {
  let accepted = false;
  let cancelled = false;

  return {
    accept: () => {
      accepted = true;
    },
    cancel: () => {
      cancelled = true;
    },
    open: () => {
      accepted = false;
      cancelled = false;
    },
    takeCancel: () => {
      const result = cancelled && !accepted;

      cancelled = false;

      return result;
    },
  };
};
