import { MILLISECONDS_IN_SECOND, MINUTES_IN_HOUR, SECONDS_IN_MINUTE } from "@nfl-pool-monorepo/utils/constants";
import { useEffect, useRef, useState } from "react";

import { getTimeRemaining, getTimeRemainingString } from "@/lib/dates";

export const useCountdown = (countdownTo: Date): string => {
  const countdownToTime = countdownTo?.getTime() ?? null;
  const interval = useRef<number>(0);
  const [remaining, setRemaining] = useState<string>("");

  useEffect(() => {
    const end = countdownToTime === null ? new Date() : new Date(countdownToTime);

    const updateRemaining = (): number => {
      const timeParts = getTimeRemaining(end);

      setRemaining(getTimeRemainingString(timeParts));

      return timeParts.total;
    };

    const total = updateRemaining();

    if (total < MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * MINUTES_IN_HOUR) {
      interval.current = window.setInterval(updateRemaining, 1000);

      return () => window.clearInterval(interval.current);
    }

    return undefined;
  }, [countdownToTime]);

  return remaining;
};
