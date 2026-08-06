import { useEffect, useState } from "react";

const DEFAULT_INTERVAL_MS = 30_000;

/**
 * Returns null until mount to keep the SSR render and initial hydration render identical,
 * then updates on an interval. Callers must supply their own render-safe default for the
 * pre-mount case (e.g. treat a game as "not started yet").
 */
export const useNow = (intervalMs: number = DEFAULT_INTERVAL_MS): Date | null => {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // react-doctor-disable-next-line react-hooks-js/set-state-in-effect -- seeds the real clock value after mount so SSR/hydration render an identical "not yet known" state first
    setNow(new Date());

    const interval = setInterval(() => setNow(new Date()), intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return now;
};
