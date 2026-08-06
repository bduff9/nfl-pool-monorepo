import type { Status, User } from "@nfl-pool-monorepo/types";

export const showWeekResults = (weeklyMvCount: number): boolean => weeklyMvCount > 0;

export const showOverallResults = (overallMvCount: number): boolean => overallMvCount > 0;

export const showMakePicks = (tiebreakerHasSubmitted: number | null | undefined): boolean =>
  tiebreakerHasSubmitted !== 1;

export const showViewAllPicks = (weeklyMvCount: number, tiebreakerHasSubmitted: number | null | undefined): boolean =>
  weeklyMvCount > 0 && tiebreakerHasSubmitted === 1;

export const showRegisterForSurvivor = (hasSeasonStarted: boolean, user: User): boolean =>
  !(hasSeasonStarted || user.playsSurvivor);

export const showDropOutOfSurvivor = (hasSeasonStarted: boolean, user: User): boolean =>
  !hasSeasonStarted && !!user.playsSurvivor;

export const showMakeSurvivorPick = (user: User, isAliveInSurvivor: boolean, selectedWeekStatus: Status): boolean =>
  !!user.playsSurvivor && isAliveInSurvivor && selectedWeekStatus === "Not Started";

export const showViewSurvivorPicks = (survivorMvCount: number): boolean => survivorMvCount > 0;

export const showScoreboard = (user: User): boolean => !!user.doneRegistering;

export const showAccountLinks = (user: User): boolean => user.doneRegistering === 1;

export const showAdminSection = (user: User): boolean => user.isAdmin === 1;
