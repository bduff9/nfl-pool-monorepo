import type { Status, User } from "@nfl-pool-monorepo/types";

export const showWeekResults = (weeklyMvCount: number): boolean => weeklyMvCount > 0;

export const showOverallResults = (overallMvCount: number): boolean => overallMvCount > 0;

export const showHeadToHead = (weeklyMvCount: number): boolean => weeklyMvCount > 0;

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

// How many things still need the user's attention, shown on the installed app's icon. Null when the view is not
// the current week, so the badge is left as it was instead of describing the wrong week.
export const getAppBadgeCount = (
  isCurrentWeek: boolean,
  user: User,
  tiebreakerHasSubmitted: number | null | undefined,
  isAliveInSurvivor: boolean,
  selectedWeekStatus: Status,
): number | null =>
  isCurrentWeek
    ? Number(showMakePicks(tiebreakerHasSubmitted)) +
      Number(showMakeSurvivorPick(user, isAliveInSurvivor, selectedWeekStatus))
    : null;

export const showScoreboard = (user: User): boolean => !!user.doneRegistering;

export const showAccountLinks = (user: User): boolean => user.doneRegistering === 1;

export const showAdminSection = (user: User): boolean => user.isAdmin === 1;
