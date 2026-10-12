const FOREGROUND_REFRESH_INTERVAL_MS = 30_000;

export const shouldRefresh = (lastRefreshAt: number, now: number): boolean =>
  now - lastRefreshAt >= FOREGROUND_REFRESH_INTERVAL_MS;
