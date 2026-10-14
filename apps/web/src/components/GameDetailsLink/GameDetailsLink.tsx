import type { Route } from "next";
import type { FC } from "react";

import { WeekLink } from "../WeekLink/WeekLink";

type Props = {
  game: { GameStatus: string; GameWeek: number; espnEventId?: string | undefined };
};

/** Right-aligned link under a finished scoreboard card to its game page (live cards link from their strip). */
const GameDetailsLink: FC<Props> = ({ game }) => {
  if (game.GameStatus !== "Final" || !game.espnEventId) {
    return null;
  }

  return (
    <WeekLink
      className="block border border-t-0 border-border bg-muted px-3 py-2 text-right text-sm font-semibold hover:bg-border/30"
      href={`/scoreboard/game/${game.espnEventId}?week=${game.GameWeek}` as Route}
      preserveWeek={false}
    >
      Game details <span aria-hidden>›</span>
    </WeekLink>
  );
};

export default GameDetailsLink;
