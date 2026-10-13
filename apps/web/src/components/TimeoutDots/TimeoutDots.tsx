import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC } from "react";

const TIMEOUT_SLOTS = [1, 2, 3];

type Props = { className?: string; name: string; remaining: number };

/** Three dots, filled for each timeout a team has left, with the count spelled out for screen readers. */
const TimeoutDots: FC<Props> = ({ className, name, remaining }) => (
  <span className={cn("flex gap-1", className)}>
    {TIMEOUT_SLOTS.map((slot) => (
      <span
        aria-hidden
        className={cn("size-1.5 rounded-full border border-foreground/70", slot <= remaining && "bg-foreground/70")}
        key={slot}
      />
    ))}
    <span className="sr-only">
      {name} has {remaining} {remaining === 1 ? "timeout" : "timeouts"} left
    </span>
  </span>
);

export default TimeoutDots;
