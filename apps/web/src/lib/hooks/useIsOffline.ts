import { useOffline } from "next/offline";
import { useSyncExternalStore } from "react";

import { LAST_SYNCED_EVENT, readLastSynced } from "@/lib/serviceWorker";

const subscribeToConnectivity = (onChange: () => void): (() => void) => {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);

  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
};

const subscribeToLastSynced = (onChange: () => void): (() => void) => {
  window.addEventListener(LAST_SYNCED_EVENT, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(LAST_SYNCED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
};

// Next only learns about connectivity from failed requests, so also trust the browser's own online/offline state
export const useIsOffline = (): boolean => {
  const nextOffline = useOffline();
  const browserOffline = useSyncExternalStore(
    subscribeToConnectivity,
    () => !navigator.onLine,
    () => false,
  );

  return nextOffline || browserOffline;
};

// When the saved copies of the informational pages were last refreshed, as epoch milliseconds
export const useLastSynced = (): null | number => {
  const raw = useSyncExternalStore(subscribeToLastSynced, readLastSynced, () => null);
  const at = Number(raw);

  return raw && Number.isFinite(at) ? at : null;
};
