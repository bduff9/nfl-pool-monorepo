export const getPreviousTeamId = (picks: { SurvivorPickWeek: number; TeamID: null | number }[], week: number) =>
  picks.find((pick) => pick.SurvivorPickWeek === week)?.TeamID ?? null;

export const getSavingToastMessage = (isOffline: boolean) =>
  isOffline ? "You're offline - this will save once you're back online" : "Saving survivor pick...";
