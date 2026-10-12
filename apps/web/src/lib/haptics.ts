const TAP_DURATION_MS = 10;

let switchLabel: HTMLLabelElement | null = null;

const createSwitchLabel = (): HTMLLabelElement => {
  const input = document.createElement("input");

  input.type = "checkbox";
  input.setAttribute("switch", "");
  input.setAttribute("aria-hidden", "true");
  input.tabIndex = -1;

  const label = document.createElement("label");

  Object.assign(label.style, {
    height: "1px",
    left: "-9999px",
    opacity: "0",
    pointerEvents: "none",
    position: "fixed",
    width: "1px",
  });
  label.append(input);
  document.body.append(label);

  return label;
};

// Toggling an iOS 18+ switch through its label plays the system haptic. The label has to be in the DOM to be clickable,
// so it is created once and reused.
const getSwitchLabel = (): HTMLLabelElement => {
  switchLabel ??= createSwitchLabel();

  return switchLabel;
};

const canVibrate = (): boolean => typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

// A short buzz for picking up and dropping things. Android browsers vibrate; iOS plays a switch haptic instead.
export const hapticTap = (): void => {
  if (canVibrate()) {
    navigator.vibrate(TAP_DURATION_MS);
  } else if (typeof document !== "undefined") {
    getSwitchLabel().click();
  }
};
