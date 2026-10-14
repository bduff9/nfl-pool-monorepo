// The alerts the last page showed above its content. A page's loading skeleton renders them too, so the content below
// starts where it will settle instead of moving down when the page's own alerts arrive. Read it through
// useSyncExternalStore with getServerAlertsSnapshot, so server rendering and hydration always show no alerts.
const NO_ALERTS: readonly string[] = [];

let alerts: readonly string[] = NO_ALERTS;

export const rememberAlerts = (next: readonly string[]): void => {
  alerts = next.length ? next : NO_ALERTS;
};

/** Drops the remembered alerts (signing out), so the next user signed in on this tab never sees this one's. */
export const forgetAlerts = (): void => {
  alerts = NO_ALERTS;
};

export const getAlertsSnapshot = (): readonly string[] => alerts;

export const getServerAlertsSnapshot = (): readonly string[] => NO_ALERTS;

// The snapshot only changes when a page renders its own alerts, which then replace the skeleton
export const subscribeToAlerts = (): (() => void) => () => {};
