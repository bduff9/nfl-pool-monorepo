"use client";

import { cn } from "@nfl-pool-monorepo/utils/styles";
import { useOffline } from "next/offline";
import { useAction } from "next-safe-action/hooks";
import {
  addTransitionType,
  type Dispatch,
  type FC,
  type SetStateAction,
  startTransition,
  useEffect,
  useRef,
  useState,
  useTransition,
  ViewTransition,
} from "react";
import { FaAt, FaInfoCircle, FaTimesCircle } from "react-icons/fa";
import { toast } from "sonner";

import { onActionError } from "@/lib/actionErrorToast";
import { SURVIVOR_PICK_INSTRUCTIONS } from "@/lib/constants";
import { formatDateForKickoff, formatTimeFromKickoff } from "@/lib/dates";
import { makeSurvivorPick } from "@/server/actions/survivor";
import type { getGamesForWeekCached } from "@/server/loaders/game";
import type { getMySurvivorPicks } from "@/server/loaders/survivor";
import type { getTeamsOnBye } from "@/server/loaders/team";

import SurvivorTeam from "../SurvivorTeam/SurvivorTeam";
import TeamDetail from "../TeamDetail/TeamDetail";
import { getPreviousTeamId, getSavingToastMessage } from "./survivorPickHelpers";

// Only opening or closing a game's details animates these boundaries: a pick (the week badge hop) or a page or week
// change leaves them still
const DETAIL_TRANSITION = "survivor-detail";
const detailFade = { default: "none", [DETAIL_TRANSITION]: "nav-fade" } as const;
const detailMove = { default: "none", [DETAIL_TRANSITION]: "morph" } as const;
const detailPanelEnter = { default: "none", [DETAIL_TRANSITION]: "detail-expand" } as const;
const detailPanelExit = { default: "none", [DETAIL_TRANSITION]: "detail-collapse" } as const;

const SURVIVOR_WEEK_BADGE = "survivor-week-badge";

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
  week: number;
  weekInProgress: number | null;
};

type SurvivorPick = Awaited<ReturnType<typeof getMySurvivorPicks>>[number];

// Only the badge of the week being picked carries the name, so it hops from the old team to the new one on a new pick
const getBadgeTransitionName = (pick: SurvivorPick | undefined, week: number): string | undefined =>
  pick?.SurvivorPickWeek === week ? SURVIVOR_WEEK_BADGE : undefined;

const SurvivorGameCard: FC<SurvivorGameCardProps> = ({
  game,
  loading,
  optimisticPicks,
  selectedGame,
  setSelectedGame,
  setSurvivorPick,
  week,
  weekInProgress,
}) => {
  const visitorPick = optimisticPicks.find((pick) => pick.TeamID === game.visitorTeam?.TeamID);
  const homePick = optimisticPicks.find((pick) => pick.TeamID === game.homeTeam?.TeamID);
  const onToggleGame = () => {
    startTransition(() => {
      addTransitionType(DETAIL_TRANSITION);
      setSelectedGame((currentGame) => (currentGame ? null : game));
    });
  };

  const onSelectVisitor = () => {
    setSurvivorPick(game.GameID, game.visitorTeam?.TeamID ?? null);
  };

  const onSelectHome = () => {
    setSurvivorPick(game.GameID, game.homeTeam?.TeamID ?? null);
  };

  const [localKickoffTime, setLocalKickoffTime] = useState<string | null>(null);

  useEffect(() => {
    // react-doctor-disable-next-line react-hooks-js/set-state-in-effect -- the visitor's timezone is unknown during SSR, so this can only be formatted in their local timezone once mounted, same pattern as useNow.ts
    setLocalKickoffTime(formatTimeFromKickoff(game.GameKickoff));
  }, [game.GameKickoff]);

  return (
    <div className={cn("w-full md:w-1/2 lg:w-1/3 2xl:w-1/4 flex flex-wrap pb-3 relative h-48")}>
      <button
        aria-label={selectedGame ? "Collapse game details" : "Expand game details"}
        className={cn(
          "w-full text-muted border border-border flex justify-around overflow-hidden cursor-pointer h-[25px] bg-muted items-center",
        )}
        onClick={onToggleGame}
        type="button"
      >
        <div>{formatDateForKickoff(game.GameKickoff)}</div>
        <div>{localKickoffTime}</div>
        <div>{selectedGame ? <FaTimesCircle className="text-red-500" /> : <FaInfoCircle />}</div>
      </button>
      <SurvivorTeam
        badgeTransitionName={getBadgeTransitionName(visitorPick, week)}
        loading={loading}
        onClick={onSelectVisitor}
        pick={visitorPick}
        team={game.visitorTeam}
        weekInProgress={weekInProgress}
      />
      <SurvivorTeam
        badgeTransitionName={getBadgeTransitionName(homePick, week)}
        isHome
        loading={loading}
        onClick={onSelectHome}
        pick={homePick}
        team={game.homeTeam}
        weekInProgress={weekInProgress}
      />
      <div
        className={cn(
          "absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border py-px px-1 bg-muted",
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
  // The pick being saved, shown over the server's picks it was made against until fresh picks arrive from the server. It
  // is set and rolled back in a transition rather than with useOptimistic, whose urgent updates never start a view
  // transition, so the week badge hops from the old team to the new one (and back if the pick fails)
  const [pendingPick, setPendingPick] = useState<null | { basePicks: typeof survivorPicks; teamId: number | null }>(
    null,
  );
  const shownPicks =
    pendingPick?.basePicks === survivorPicks
      ? survivorPicks.map((pick) => (pick.SurvivorPickWeek === week ? { ...pick, TeamID: pendingPick.teamId } : pick))
      : survivorPicks;
  const toastIdRef = useRef<string | number | undefined>(undefined);
  const previousTeamIdRef = useRef<number | null>(null);
  const [, startSurvivorPickUpdating] = useTransition();

  const { execute: executeSurvivorPick } = useAction(makeSurvivorPick, {
    onError: (args) => {
      onActionError(args);
      startSurvivorPickUpdating(() => {
        setPendingPick((current) => current && { ...current, teamId: previousTeamIdRef.current });
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

    previousTeamIdRef.current = getPreviousTeamId(survivorPicks, week);
    setLoading(teamID);

    toastIdRef.current = toast.loading(getSavingToastMessage(isOffline), {
      closeButton: false,
      dismissible: false,
      duration: Infinity,
    });

    startSurvivorPickUpdating(() => {
      setPendingPick({ basePicks: survivorPicks, teamId: teamID });
    });
    // Saved from the next task: transitions started in the same event share a lane, so starting the save here would hold
    // the badge hop back until the server answered
    setTimeout(() => executeSurvivorPick({ gameID, teamID, week }), 0);
  };

  return (
    <div className="flex flex-col min-h-dvh">
      <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-5 text-center">
        {SURVIVOR_PICK_INSTRUCTIONS}
      </h4>
      <div className="flex flex-wrap">
        {games.flatMap((game) => {
          if (selectedGame && game.GameID !== selectedGame.GameID) {
            return [];
          }

          return (
            <ViewTransition
              default="none"
              enter={detailFade}
              exit={detailFade}
              key={`survivor-game-${game.GameID}`}
              update={detailMove}
            >
              <SurvivorGameCard
                game={game}
                loading={loading}
                optimisticPicks={shownPicks}
                selectedGame={selectedGame}
                setSelectedGame={setSelectedGame}
                setSurvivorPick={setSurvivorPick}
                week={week}
                weekInProgress={weekInProgress}
              />
            </ViewTransition>
          );
        })}
      </div>
      {selectedGame ? (
        <ViewTransition default="none" enter={detailPanelEnter} exit={detailPanelExit} key="team-detail">
          <TeamDetail game={selectedGame} />
        </ViewTransition>
      ) : teamsOnBye.length > 0 ? (
        <ViewTransition default="none" enter={detailFade} exit={detailFade} key="teams-on-bye">
          {/* Its own wrapping row, like the games above: in the page's column the teams would stack one per line */}
          <div className="flex flex-wrap">
            <h5 className="w-full text-center pt-4 text-lg font-semibold">Teams on Bye Week</h5>
            {teamsOnBye.map((team) => (
              <SurvivorTeam
                isOnBye
                key={`bye-week-team-${team.TeamID}`}
                pick={shownPicks.find((pick) => pick.TeamID === team.TeamID)}
                team={team}
                weekInProgress={weekInProgress}
              />
            ))}
          </div>
        </ViewTransition>
      ) : null}
    </div>
  );
};

export default MakeSurvivorPickClient;
