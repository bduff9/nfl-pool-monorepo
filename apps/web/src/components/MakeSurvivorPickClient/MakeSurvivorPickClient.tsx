"use client";

import { cn } from "@nfl-pool-monorepo/utils/styles";
import { useOffline } from "next/offline";
import { useAction } from "next-safe-action/hooks";
import { type Dispatch, type FC, type SetStateAction, useOptimistic, useRef, useState, useTransition } from "react";
import { FaAt, FaInfoCircle, FaTimesCircle } from "react-icons/fa";
import { toast } from "sonner";

import { SURVIVOR_PICK_INSTRUCTIONS } from "@/lib/constants";
import { formatDateForKickoff, formatTimeFromKickoff } from "@/lib/dates";
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

type SurvivorGameCardProps = {
  game: Awaited<ReturnType<typeof getGamesForWeekCached>>[number];
  loading: null | number;
  optimisticPicks: Awaited<ReturnType<typeof getMySurvivorPicks>>;
  selectedGame: null | Awaited<ReturnType<typeof getGamesForWeekCached>>[number];
  setSelectedGame: Dispatch<SetStateAction<null | Awaited<ReturnType<typeof getGamesForWeekCached>>[number]>>;
  setSurvivorPick: (gameID: number, teamID: number | null) => void;
  weekInProgress: number | null;
};

const SurvivorGameCard: FC<SurvivorGameCardProps> = ({
  game,
  loading,
  optimisticPicks,
  selectedGame,
  setSelectedGame,
  setSurvivorPick,
  weekInProgress,
}) => {
  const onToggleGame = () => {
    setSelectedGame((currentGame) => (currentGame ? null : game));
  };

  const onSelectVisitor = () => {
    setSurvivorPick(game.GameID, game.visitorTeam?.TeamID ?? null);
  };

  const onSelectHome = () => {
    setSurvivorPick(game.GameID, game.homeTeam?.TeamID ?? null);
  };

  return (
    <div className={cn("w-full md:w-1/2 lg:w-1/3 2xl:w-1/4 flex flex-wrap pb-3 relative h-48")}>
      <button
        aria-label={selectedGame ? "Collapse game details" : "Expand game details"}
        className={cn(
          "w-full text-muted border border-black flex justify-around overflow-hidden cursor-pointer h-[25px] bg-gray-100 items-center",
        )}
        onClick={onToggleGame}
        type="button"
      >
        <div>{formatDateForKickoff(game.GameKickoff)}</div>
        <div>{formatTimeFromKickoff(game.GameKickoff)}</div>
        <div>{selectedGame ? <FaTimesCircle className="text-red-500" /> : <FaInfoCircle />}</div>
      </button>
      <SurvivorTeam
        loading={loading}
        onClick={onSelectVisitor}
        pick={optimisticPicks.find((pick) => pick.TeamID === game.visitorTeam?.TeamID)}
        team={game.visitorTeam}
        weekInProgress={weekInProgress}
      />
      <SurvivorTeam
        isHome
        loading={loading}
        onClick={onSelectHome}
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
  );
};

const MakeSurvivorPickClient: FC<Props> = ({ games, survivorPicks, teamsOnBye, week, weekInProgress }) => {
  const isOffline = useOffline();
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
  const toastIdRef = useRef<string | number | undefined>(undefined);
  const previousTeamIdRef = useRef<number | null>(null);
  const [, startSurvivorPickUpdating] = useTransition();

  const { execute: executeSurvivorPick } = useAction(makeSurvivorPick, {
    onError: ({ error }) => {
      toast.error("Something went wrong!", {
        description: error.serverError ?? "Please check the information you are submitting.",
      });
      startSurvivorPickUpdating(() => {
        setOptimisticPick(previousTeamIdRef.current);
      });
    },
    onSettled: () => {
      if (toastIdRef.current) toast.dismiss(toastIdRef.current);
      setLoading(null);
    },
    onSuccess: () => {
      toast.success(`Successfully saved survivor pick for week ${week}`);
    },
  });

  const setSurvivorPick = (gameID: number, teamID: number | null): void => {
    if (loading) return;

    previousTeamIdRef.current = survivorPicks.find((pick) => pick.SurvivorPickWeek === week)?.TeamID ?? null;
    setLoading(teamID);

    toastIdRef.current = toast.loading(
      isOffline ? "You're offline - this will save once you're back online" : "Saving survivor pick...",
      {
        closeButton: false,
        dismissible: false,
        duration: Infinity,
      },
    );

    startSurvivorPickUpdating(() => {
      setOptimisticPick(teamID);
      executeSurvivorPick({ gameID, teamID, week });
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-5 text-center">
        {SURVIVOR_PICK_INSTRUCTIONS}
      </h4>
      <div className="flex flex-wrap">
        {games.flatMap((game) => {
          if (selectedGame && game.GameID !== selectedGame.GameID) {
            return [];
          }

          return (
            <SurvivorGameCard
              game={game}
              key={`survivor-game-${game.GameID}`}
              loading={loading}
              optimisticPicks={optimisticPicks}
              selectedGame={selectedGame}
              setSelectedGame={setSelectedGame}
              setSurvivorPick={setSurvivorPick}
              weekInProgress={weekInProgress}
            />
          );
        })}
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
