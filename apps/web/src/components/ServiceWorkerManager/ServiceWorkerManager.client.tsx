"use client";
import "client-only";

import { type FC, useEffect } from "react";
import { toast } from "sonner";

import { OFFLINE_CACHE_ENABLED, registerServiceWorker } from "@/lib/serviceWorker";

const UPDATE_TOAST_ID = "app-update";

// Registers the service worker and tells people when a newer version is ready, instead of swapping it silently
// mid-session. A new worker waits until the toast's Reload is tapped. Same approach as ServiceIQPro. Renders nothing.
const ServiceWorkerManager: FC = () => {
  // react-doctor-disable-next-line effect-needs-cleanup -- every listener added below is tied to one AbortController through { signal }, and the cleanup aborts it
  useEffect(() => {
    // Production only: in dev the worker would cache dev-server output and fight HMR
    if (!(OFFLINE_CACHE_ENABLED && "serviceWorker" in navigator)) {
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;
    let updateRequested = false;

    const promptUpdate = (registration: ServiceWorkerRegistration): void => {
      const waiting = registration.waiting;

      if (!waiting) {
        return;
      }

      toast("A new version of the app is available.", {
        action: {
          label: "Reload",
          onClick: () => {
            updateRequested = true;
            waiting.postMessage({ type: "SKIP_WAITING" });
          },
        },
        duration: Number.POSITIVE_INFINITY,
        id: UPDATE_TOAST_ID,
      });
    };

    const watchForUpdates = (registration: ServiceWorkerRegistration): void => {
      // A worker can already be waiting from a previous visit
      promptUpdate(registration);

      registration.addEventListener(
        "updatefound",
        () => {
          const installing = registration.installing;

          installing?.addEventListener(
            "statechange",
            () => {
              // "installed" with an existing controller means an update is waiting; without one it's the first install
              if (installing.state === "installed" && navigator.serviceWorker.controller) {
                promptUpdate(registration);
              }
            },
            { signal },
          );
        },
        { signal },
      );
    };

    registerServiceWorker()
      .then((registration) => {
        if (!signal.aborted) {
          watchForUpdates(registration);
        }
      })
      .catch(() => {
        // A failed registration must never break the app; offline support just stays off for this session
      });

    // An installed app can stay alive for days, so look for a new worker every time it returns to the foreground
    const onVisibilityChange = (): void => {
      if (document.visibilityState !== "visible") {
        return;
      }

      navigator.serviceWorker
        .getRegistration()
        .then((registration) => registration?.update())
        .catch(() => {
          // Best effort, e.g. while offline
        });
    };

    // Reload once, only after the user accepted the update: the first install also changes the controller and must not
    // reload a freshly opened page
    const onControllerChange = (): void => {
      if (updateRequested) {
        updateRequested = false;
        window.location.reload();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange, { signal });
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange, { signal });

    return () => controller.abort();
  }, []);

  return null;
};

export default ServiceWorkerManager;
