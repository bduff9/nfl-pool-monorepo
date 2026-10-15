"use client";

import { useEffect, useState } from "react";

// How much of the layout viewport the on-screen keyboard covers, in px. iOS keeps the layout viewport full height when
// the keyboard opens (it only shrinks the visual viewport), so anything fixed to the bottom edge ends up behind it.
const getKeyboardInset = (): number => {
  const viewport = window.visualViewport;

  if (!viewport) {
    return 0;
  }

  return Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop));
};

export const useKeyboardInset = (): number => {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;

    if (!viewport) {
      return;
    }

    const update = (): void => setInset(getKeyboardInset());

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);

    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return inset;
};
