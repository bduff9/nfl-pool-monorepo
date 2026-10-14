import { forgetAlerts } from "@/components/CustomHead/alertsHandoff";
import { forgetScoreboard } from "@/components/ScoreboardGameCard/scoreboardHandoff";

import { forgetSharedElementHandoffs } from "./sharedElementHandoff";

/**
 * Drops everything the client handoff stores remember for loading skeletons (rank rings, bars, titles, the survivor
 * pick, alerts, scoreboard stakes). They live in this tab's JavaScript, which survives signing out and back in without
 * a page load, so call this on sign out and when the login page shows: the next user must never see the last one's data.
 */
export const forgetHandoffs = (): void => {
  forgetSharedElementHandoffs();
  forgetAlerts();
  forgetScoreboard();
};
