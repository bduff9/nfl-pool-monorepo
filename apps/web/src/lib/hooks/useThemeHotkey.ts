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

export const useThemeHotkey = (): void => {
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (isTypingTarget(event.target)) {
        return;
      }

      const isPlainD = event.key.toLowerCase() === "d" && !event.metaKey && !event.ctrlKey && !event.altKey;
      const isShiftModifierD = event.shiftKey && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d";

      if (!isPlainD && !isShiftModifierD) {
        return;
      }

      event.preventDefault();
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resolvedTheme, setTheme]);
};
