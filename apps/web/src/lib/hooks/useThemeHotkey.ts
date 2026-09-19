"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
};

type HotkeyKeyboardEvent = Pick<KeyboardEvent, "altKey" | "ctrlKey" | "key" | "metaKey" | "shiftKey">;

/** @public exported for unit testing only */
export const isThemeToggleHotkey = (event: HotkeyKeyboardEvent): boolean => {
  const key = event.key.toLowerCase();
  const isPlainD = key === "d" && !event.metaKey && !event.ctrlKey && !event.altKey;
  const isShiftModifierD = event.shiftKey && (event.metaKey || event.ctrlKey) && key === "d";

  return isPlainD || isShiftModifierD;
};

export const useThemeHotkey = (): void => {
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (isTypingTarget(event.target) || !isThemeToggleHotkey(event)) {
        return;
      }

      event.preventDefault();
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resolvedTheme, setTheme]);
};
