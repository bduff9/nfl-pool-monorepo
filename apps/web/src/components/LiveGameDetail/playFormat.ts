const REGULATION_PERIODS = 4;

/** "Q2 8:00", "OT 3:12", or whatever part ESPN supplied. */
export const formatPlayTime = (period: number | undefined, clock: string | undefined): string => {
  const quarter = period === undefined ? undefined : period > REGULATION_PERIODS ? "OT" : `Q${period}`;

  return [quarter, clock].filter(Boolean).join(" ");
};
