import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC } from "react";

const TIMEOUT_SLOTS = [1, 2, 3];

type Props = { className?: string; name: string; remaining: number };

/**
 * Three dots, filled for each timeout a team has left, with the count spelled out for screen readers. A timeout used
 * mid-game empties its dot by shrinking the fill away.
 */
const TimeoutDots: FC<Props> = ({ className, name, remaining }) => (
  <span className={cn("flex gap-1", className)}>
    {TIMEOUT_SLOTS.map((slot) => (
      <span
        aria-hidden
        className={cn(
          "relative size-1.5 rounded-full border border-foreground/70",
          "before:absolute before:-inset-px before:rounded-full before:bg-foreground/70",
          "before:transition-[scale,opacity] before:duration-500 before:ease-out motion-reduce:before:transition-none",
          slot > remaining && "before:scale-0 before:opacity-0",
        )}
        key={slot}
      />
    ))}
    <span className="sr-only">
      {name} has {remaining} {remaining === 1 ? "timeout" : "timeouts"} left
    </span>
  </span>
);

export default TimeoutDots;
