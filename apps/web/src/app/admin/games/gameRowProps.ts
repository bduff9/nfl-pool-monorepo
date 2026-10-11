import type { ComponentProps } from "react";

import type AdminGameRow from "@/components/AdminGameRow/AdminGameRow";

const KICKOFF_FORMAT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Chicago",
});

type GameRowSource = {
  GameHomeScore: number | null;
  GameID: number;
  GameKickoff: Date;
  GameStatus: ComponentProps<typeof AdminGameRow>["status"];
  GameVisitorScore: number | null;
  homeTeam?: { TeamName: string } | null | undefined;
  visitorTeam?: { TeamName: string } | null | undefined;
};

const getTeamName = (team: { TeamName: string } | null | undefined): string => team?.TeamName ?? "Unknown";

export const toAdminGameRowProps = (game: GameRowSource): ComponentProps<typeof AdminGameRow> => ({
  away: getTeamName(game.visitorTeam),
  gameID: game.GameID,
  home: getTeamName(game.homeTeam),
  homeScore: game.GameHomeScore ?? 0,
  kickoffLabel: KICKOFF_FORMAT.format(game.GameKickoff),
  status: game.GameStatus,
  visitorScore: game.GameVisitorScore ?? 0,
});
