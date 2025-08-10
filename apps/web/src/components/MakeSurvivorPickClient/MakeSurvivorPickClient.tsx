"use client";

import { cn } from "@nfl-pool-monorepo/utils/styles";
import { type FC, useOptimistic, useState } from "react";
import { FaAt, FaInfoCircle, FaTimesCircle } from "react-icons/fa";
import { toast } from "sonner";

import { SURVIVOR_PICK_INSTRUCTIONS } from "@/lib/constants";
import { formatDateForKickoff, formatTimeFromKickoff } from "@/lib/dates";
import { processFormState } from "@/lib/zsa";
import { makeSurvivorPick } from "@/server/actions/survivor";
import type { getGamesForWeekCached } from "@/server/loaders/game";
import type { getMySurvivorPicks } from "@/server/loaders/survivor";
import type { getTeamsOnBye } from "@/server/loaders/team";

import SurvivorTeam from "../SurvivorTeam/SurvivorTeam";
import TeamDetail from "../TeamDetail/TeamDetail";

type Props = {
  games: Awaited<ReturnType<typeof getGamesForWeekCached>>;
  survivorPicks: Awaited<ReturnType<typeof getMySurvivorPicks>>;
  teamsOnBye: Awaited<ReturnType<typeof getTeamsOnBye>>;
  week: number;
  weekInProgress: number | null;
};

const MakeSurvivorPickClient: FC<Props> = ({ games, survivorPicks, teamsOnBye, week, weekInProgress }) => {
  const [selectedGame, setSelectedGame] = useState<null | (typeof games)[number]>(null);
  const [loading, setLoading] = useState<null | number>(null);
  const [optimisticPicks, setOptimisticPick] = useOptimistic(survivorPicks, (currentPicks, teamId: number | null) => {
    return currentPicks.map((pick) => {
      if (pick.SurvivorPickWeek === week) {
        return {
          ...pick,
          TeamID: teamId,
        };
      }

      return pick;
    });
  });

  const setSurvivorPick = async (gameID: number, teamID: number | null): Promise<void> => {
    if (loading) return;

    setLoading(teamID);

    const toastId = toast.loading("Saving survivor pick...", {
      closeButton: false,
      dismissible: false,
      duration: Infinity,
    });

    setOptimisticPick(teamID);

    const result = await makeSurvivorPick({ gameID, teamID, week });

    processFormState(result, undefined, `Successfully saved survivor pick for week ${week}`);
    toast.dismiss(toastId);
    setLoading(null);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-5 text-center">
        {SURVIVOR_PICK_INSTRUCTIONS}
      </h4>
      <div className="flex flex-wrap">
        {games
          .filter((game) => !selectedGame || game.GameID === selectedGame.GameID)
          .map((game) => (
            <div
              className={cn("w-full md:w-1/2 lg:w-1/3 2xl:w-1/4 flex flex-wrap pb-3 relative h-48")}
              key={`survivor-game-${game.GameID}`}
            >
              {/* biome-ignore lint/a11y/noStaticElementInteractions: This div acts as a clickable area to expand/collapse game details. */}
              <div
                className={cn(
                  "w-full text-muted border border-black flex justify-around overflow-hidden cursor-pointer h-[25px] bg-gray-100 items-center",
                )}
                onClick={() => setSelectedGame((currentGame) => (currentGame ? null : game))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    setSelectedGame((currentGame) => (currentGame ? null : game));
                  }
                }}
              >
                <div>{formatDateForKickoff(game.GameKickoff)}</div>
                <div>{formatTimeFromKickoff(game.GameKickoff)}</div>
                <div>{selectedGame ? <FaTimesCircle className="text-red-500" /> : <FaInfoCircle />}</div>
              </div>
              <SurvivorTeam
                loading={loading}
                onClick={() => setSurvivorPick(game.GameID, game.visitorTeam?.TeamID ?? null)}
                pick={optimisticPicks.find((pick) => pick.TeamID === game.visitorTeam?.TeamID)}
                team={game.visitorTeam}
                weekInProgress={weekInProgress}
              />
              <SurvivorTeam
                isHome
                loading={loading}
                onClick={() => setSurvivorPick(game.GameID, game.homeTeam?.TeamID ?? null)}
                pick={optimisticPicks.find((pick) => pick.TeamID === game.homeTeam?.TeamID)}
                team={game.homeTeam}
                weekInProgress={weekInProgress}
              />
              <div
                className={cn(
                  "absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black py-px px-1 bg-gray-300",
                )}
              >
                <FaAt />
              </div>
            </div>
          ))}
      </div>
      {selectedGame ? (
        <TeamDetail game={selectedGame} />
      ) : teamsOnBye.length > 0 ? (
        <>
          <div className="w-full"></div>
          <h5 className="text-center pt-4 text-lg font-semibold">Teams on Bye Week</h5>
          {teamsOnBye.map((team) => (
            <SurvivorTeam
              isOnBye
              key={`bye-week-team-${team.TeamID}`}
              pick={optimisticPicks.find((pick) => pick.TeamID === team.TeamID)}
              team={team}
              weekInProgress={weekInProgress}
            />
          ))}
        </>
      ) : null}
    </div>
  );
};

export default MakeSurvivorPickClient;
