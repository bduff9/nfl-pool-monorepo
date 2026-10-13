/** The team ahead on win probability and its share (50-100), from the home team's 0-100 probability. */
export const getWinLeader = (homePct: number, homeName: string, visitorName: string): { name: string; pct: number } =>
  homePct >= 50 ? { name: homeName, pct: homePct } : { name: visitorName, pct: 100 - homePct };
