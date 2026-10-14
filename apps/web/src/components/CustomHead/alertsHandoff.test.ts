import { describe, expect, it } from "vitest";

import { forgetAlerts, getAlertsSnapshot, getServerAlertsSnapshot, rememberAlerts } from "./alertsHandoff";

describe("alertsHandoff", () => {
  it("remembers the last alerts shown", () => {
    const alerts = ["Please pay"];

    rememberAlerts(alerts);

    expect(getAlertsSnapshot()).toBe(alerts);
  });

  it("keeps one stable empty list", () => {
    rememberAlerts([]);

    expect(getAlertsSnapshot()).toBe(getServerAlertsSnapshot());
    expect(getServerAlertsSnapshot()).toEqual([]);
  });

  it("forgets the alerts on sign out", () => {
    rememberAlerts(["Please pay $45"]);
    forgetAlerts();

    expect(getAlertsSnapshot()).toBe(getServerAlertsSnapshot());
  });
});
