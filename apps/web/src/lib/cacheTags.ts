export const cacheTags = {
  gamesWeek: (week: number) => `games-week-${week}`,
  overallMv: () => "overall-mv",
  weeklyMv: (week: number) => `weekly-mv-${week}`,
} as const;
