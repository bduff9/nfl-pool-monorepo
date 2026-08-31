"use client";

import { SIDEBAR_COOKIE_NAME, useSidebar } from "@nfl-pool-monorepo/ui/components/sidebar";
import { type FC, useLayoutEffect } from "react";
import "client-only";

const readStoredSidebarOpen = (): boolean | null => {
  const entry = document.cookie.split("; ").find((row) => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`));

  if (!entry) {
    return null;
  }

  const value = entry.slice(SIDEBAR_COOKIE_NAME.length + 1);

  if (value === "true") return true;
  if (value === "false") return false;

  return null;
};

const SidebarOpenSync: FC = () => {
  const { open, setOpen } = useSidebar();

  // biome-ignore lint/correctness/useExhaustiveDependencies: only sync from the cookie once, on mount
  useLayoutEffect(() => {
    const stored = readStoredSidebarOpen();

    if (stored !== null && stored !== open) {
      setOpen(stored);
    }
  }, []);

  return null;
};

export default SidebarOpenSync;
