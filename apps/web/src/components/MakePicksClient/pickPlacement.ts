import type { DraggableLocation } from "@hello-pangea/dnd";

import { parseDragData } from "@/lib/strings";
import type { getMyWeeklyPicks } from "@/server/loaders/pick";

export type WeeklyPicks = Awaited<ReturnType<typeof getMyWeeklyPicks>>;
type DropDestination = NonNullable<ReturnType<typeof parseDragData>[2]>;
type DroppedTeam = WeeklyPicks[number]["pickTeam"];

// The team a point was dropped on, or null when it was dropped back on the bank or on nothing
const getDroppedTeam = (pick: WeeklyPicks[number] | undefined, destination: DropDestination | null): DroppedTeam => {
  if (!pick || !destination) {
    return null;
  }

  if (destination.type === "home") {
    return pick.homeTeam;
  }

  return destination.type === "visitor" ? pick.visitorTeam : null;
};

// Puts the points on the dropped game and frees them from whichever other game held them. Started games never change.
export const placePoints = (
  picks: WeeklyPicks,
  gameID: null | number,
  points: number,
  pickTeam: DroppedTeam,
  now: Date,
): WeeklyPicks =>
  picks.map((pick) => {
    if (pick.GameKickoff < now) {
      return pick;
    }

    if (gameID === pick.GameID) {
      return { ...pick, PickPoints: points, pickTeam, TeamID: pickTeam?.TeamID ?? null };
    }

    return points === pick.PickPoints ? { ...pick, PickPoints: null, pickTeam: null, TeamID: null } : pick;
  });

const isPointInUse = (pick: WeeklyPicks[number], now: Date): boolean =>
  !!pick.PickPoints && (!!pick.pickTeam || now > pick.GameKickoff);

// Points not yet placed on a game that can still change; points on a started game stay used even without a team
export const getAvailablePoints = (picks: WeeklyPicks, now: Date): Array<number> => {
  const used = new Set(picks.filter((pick) => isPointInUse(pick, now)).map((pick) => pick.PickPoints));

  return Array.from({ length: picks.length }, (_, i) => i + 1).filter((point) => !used.has(point));
};

// A drop only changes picks when it lands somewhere other than where the point started
export const isDropMove = (
  source: Pick<DraggableLocation, "droppableId">,
  destination: Pick<DraggableLocation, "droppableId"> | null | undefined,
): destination is Pick<DraggableLocation, "droppableId"> =>
  !!destination && source.droppableId !== destination.droppableId;

export type DropResolution = { gameID: null | number; points: number; pickTeam: DroppedTeam; teamID: null | number };

export const resolveDrop = (
  picks: WeeklyPicks,
  draggableId: string,
  sourceDroppableId: string,
  destinationDroppableId: string,
): DropResolution => {
  const [points, , destinationData] = parseDragData(draggableId, sourceDroppableId, destinationDroppableId);
  const gameID = destinationData?.gameID ?? null;
  const pickTeam = getDroppedTeam(
    picks.find((pick) => pick.GameID === gameID),
    destinationData,
  );

  return { gameID, pickTeam, points, teamID: pickTeam?.TeamID ?? null };
};

// "Visitor @ Home" for the week's last game, or null before the schedule has any games
export const getLastGameMatchup = (lastGame: WeeklyPicks[number] | undefined): null | string =>
  lastGame ? `${lastGame.visitorTeam?.TeamName} @ ${lastGame.homeTeam?.TeamName}` : null;

export const getTiebreakerPlaceholder = (matchup: null | string): string =>
  `Guess the total final score${matchup ? ` of the ${matchup} game` : ""}`;
