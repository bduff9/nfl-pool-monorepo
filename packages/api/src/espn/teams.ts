/**
 * ESPN's public API uses a few abbreviations that differ from the official-API TeamShortName codes
 * stored in our database. Every other team shares the same code.
 */
const ESPN_TO_TEAM_SHORT_NAME: Record<string, string> = {
  GB: "GBP",
  JAX: "JAC",
  KC: "KCC",
  LV: "LVR",
  NE: "NEP",
  NO: "NOS",
  SF: "SFO",
  TB: "TBB",
  WSH: "WAS",
};

export const toTeamShortName = (espnAbbreviation: string): string =>
  ESPN_TO_TEAM_SHORT_NAME[espnAbbreviation] ?? espnAbbreviation;
