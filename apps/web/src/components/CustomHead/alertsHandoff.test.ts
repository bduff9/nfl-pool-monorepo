import { describe, expect, it } from "vitest";

import { getAlertsSnapshot, getServerAlertsSnapshot, rememberAlerts } from "./alertsHandoff";

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
});
