"use client";
import "client-only";

import { type FC, useEffect } from "react";
import { toast } from "sonner";

import { APP_VERSION, isNewVersionAvailable } from "@/lib/appVersion";

const FIRST_CHECK_DELAY_MS = 10_000;
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

const reloadPage = (): void => window.location.reload();

const checkForNewVersion = async (): Promise<void> => {
  if (!navigator.onLine) {
    return;
  }

  const response = await fetch("/api/version", { cache: "no-store" });

  if (!response.ok) {
    return;
  }

  const { version } = (await response.json()) as { version?: unknown };

  if (isNewVersionAvailable(APP_VERSION, version)) {
    // Never reload on its own: the user may be partway through making picks
    toast("A new version of the app is available.", {
      action: { label: "Reload", onClick: reloadPage },
      duration: Number.POSITIVE_INFINITY,
      id: "app-update",
    });
  }
};

// Also asks the browser to look for a newer service worker, since an installed app can stay alive for days
const refreshServiceWorker = async (): Promise<void> => {
  const registration = await navigator.serviceWorker?.getRegistration();

  await registration?.update();
};

const check = (): void => {
  Promise.allSettled([checkForNewVersion(), refreshServiceWorker()]);
};

// Tells people when a newer version of the app has been deployed, checked shortly after load, whenever the app comes
// back to the foreground or regains a connection, and every 15 minutes while it stays open. Renders nothing.
const AppUpdateWatcher: FC = () => {
  useEffect(() => {
    if (!APP_VERSION) {
      return;
    }

    const onVisibilityChange = (): void => {
      if (document.visibilityState === "visible") {
        check();
      }
    };
    const firstCheck = window.setTimeout(check, FIRST_CHECK_DELAY_MS);
    const interval = window.setInterval(onVisibilityChange, CHECK_INTERVAL_MS);

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", check);

    return () => {
      window.clearTimeout(firstCheck);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", check);
    };
  }, []);

  return null;
};

export default AppUpdateWatcher;
