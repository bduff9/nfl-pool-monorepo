type WeekPick = { SurvivorPickWeek: number; TeamID: null | number };

export const getPreviousTeamId = (picks: WeekPick[], week: number) =>
  picks.find((pick) => pick.SurvivorPickWeek === week)?.TeamID ?? null;

export const getSavingToastMessage = (isOffline: boolean) =>
  isOffline ? "You're offline - this will save once you're back online" : "Saving survivor pick...";

/** A pick being saved: the team the server had for the week when it was made, and the team picked */
export type PendingSurvivorPick = { baseTeamId: null | number; teamId: null | number };

/**
 * Whether a pending pick still applies: the server's pick for the week is still the one it was made against. Keyed on
 * the team rather than on the picks array, so a refresh that brings the same picks (coming back to the app) keeps it.
 */
export const isPendingPickCurrent = (pending: null | PendingSurvivorPick, picks: WeekPick[], week: number): boolean =>
  pending !== null && getPreviousTeamId(picks, week) === pending.baseTeamId;

/** The server's picks with the pending team on the week's pick while it applies; the server's own once they change */
export const getShownSurvivorPicks = <T extends WeekPick>(
  pending: null | PendingSurvivorPick,
  picks: T[],
  week: number,
): T[] =>
  pending && isPendingPickCurrent(pending, picks, week)
    ? picks.map((pick) => (pick.SurvivorPickWeek === week ? { ...pick, TeamID: pending.teamId } : pick))
    : picks;
