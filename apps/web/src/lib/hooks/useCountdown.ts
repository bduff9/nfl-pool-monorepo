import { getTimeRemaining, getTimeRemainingString } from "@/lib/dates";
import { MILLISECONDS_IN_SECOND, MINUTES_IN_HOUR, SECONDS_IN_MINUTE } from "@nfl-pool-monorepo/utils/constants";
import { useEffect, useMemo, useRef, useState } from "react";

export const useCountdown = (countdownTo: Date): string => {
  // biome-ignore lint/correctness/useExhaustiveDependencies: No need for all deps
  const end = useMemo(() => countdownTo ?? new Date(), [countdownTo?.getTime() ?? null]);
  const interval = useRef<number>(0);
  const timeParts = getTimeRemaining(end);
  const [remaining, setRemaining] = useState<string>(getTimeRemainingString(timeParts));
  const { days, hours, minutes, seconds, total } = timeParts;

  useEffect(() => {
    setRemaining(getTimeRemainingString({ days, hours, minutes, seconds, total }));

    if (total < MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * MINUTES_IN_HOUR) {
      interval.current = window.setInterval(() => {
        const timeParts = getTimeRemaining(end);

        setRemaining(getTimeRemainingString(timeParts));
      }, 1000);

      return () => window.clearInterval(interval.current);
    }

    return undefined;
  }, [days, end, hours, minutes, seconds, total]);

  return remaining;
};
