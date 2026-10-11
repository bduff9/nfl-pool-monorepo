"use client";

import type { DragStart, DropResult } from "@hello-pangea/dnd";
import { Input } from "@nfl-pool-monorepo/ui/components/input";
import { Label } from "@nfl-pool-monorepo/ui/components/label";
import { useSidebar } from "@nfl-pool-monorepo/ui/components/sidebar";
import { cn } from "@nfl-pool-monorepo/utils/styles";

import { onActionError } from "@/lib/actionErrorToast";
import { hapticTap } from "@/lib/haptics";
import { useNow } from "@/lib/hooks/useNow";
import { parseDragData } from "@/lib/strings";
import { setMyPick } from "@/server/actions/pick";
import type { getMyWeeklyPicks } from "@/server/loaders/pick";
import type { getMyTiebreaker } from "@/server/loaders/tiebreaker";
import "client-only";

import dynamic from "next/dynamic";
import { useAction } from "next-safe-action/hooks";
import type { FC } from "react";
import { useOptimistic, useState, useTransition } from "react";
import { PiFootballDuotone } from "react-icons/pi";

import { PickActionsBar } from "./PickActionsBar";
import { PicksBoard } from "./PicksBoard";
import { getAvailablePoints, getDroppedTeam, placePoints } from "./pickPlacement";
import { usePickActions } from "./usePickActions";

const ConfirmationModal = dynamic(() => import("../ConfirmationModal/ConfirmationModal"), { ssr: false });

export type LoadingType = "autopick" | "reset" | "save" | "submit";

type Props = {
  selectedWeek: number;
  tiebreaker: NonNullable<Awaited<ReturnType<typeof getMyTiebreaker>>>;
  weeklyPicks: Awaited<ReturnType<typeof getMyWeeklyPicks>>;
};

const MakePicksClient: FC<Props> = ({ selectedWeek, tiebreaker, weeklyPicks }) => {
  const { open } = useSidebar();
  const [selectedGame, setSelectedGame] = useState<null | number>(null);
  const [dragGameID, setDragGameID] = useState<null | string>(null);
  const [optimisticPicks, setOptimisticPicks] = useOptimistic(weeklyPicks);
  const [picksUpdating, startPicksUpdating] = useTransition();
  const lastGame = optimisticPicks[optimisticPicks.length - 1];

  const { execute: executeSetMyPick } = useAction(setMyPick, {
    onError: onActionError,
  });

  const onDragEnd = (result: DropResult): void => {
    const { draggableId, source, destination } = result;

    setDragGameID(null);

    if (!destination) {
      return;
    }

    if (source.droppableId === destination.droppableId) {
      return;
    }

    hapticTap();

    const [points, , destinationData] = parseDragData(draggableId, source.droppableId, destination.droppableId);
    const gameID = destinationData?.gameID ?? null;
    const pickTeam = getDroppedTeam(
      optimisticPicks.find((pick) => pick.GameID === gameID),
      destinationData,
    );

    startPicksUpdating(() => {
      setOptimisticPicks((picks) => placePoints(picks, gameID, points, pickTeam, new Date()));

      executeSetMyPick({
        gameID,
        points,
        teamID: pickTeam?.TeamID ?? null,
        week: selectedWeek,
      });
    });
  };

  const onDragStart = (initial: DragStart): void => {
    const {
      source: { droppableId },
    } = initial;

    hapticTap();
    setDragGameID(droppableId.replace("home-", "").replace("visitor-", ""));
  };

  const now = useNow() ?? new Date(0);
  const available = getAvailablePoints(optimisticPicks, now);

  const {
    autoPick,
    callback,
    confirmReset,
    confirmSubmit,
    loading,
    savePicks,
    setCallback,
    tiebreakerLastScoreError,
    updateTiebreakerScore,
  } = usePickActions({
    available,
    lastGame,
    optimisticPicks,
    selectedWeek,
    setOptimisticPicks,
    startPicksUpdating,
    tiebreaker,
  });

  const onCancelCallback = () => setCallback(null);

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0">
        <h4 className="w-full mb-3 text-center shrink-1">
          Drag points to your chosen winning team or click a team to see the game details
        </h4>
        <PicksBoard
          available={available}
          dragGameID={dragGameID}
          loading={loading}
          now={now}
          onDragEnd={onDragEnd}
          onDragStart={onDragStart}
          optimisticPicks={optimisticPicks}
          selectedGame={selectedGame}
          setSelectedGame={setSelectedGame}
        >
          <div className="w-full my-3 md:px-5">
            <Label className="required" htmlFor="tiebreakerScore">
              Tiebreaker Score
              {!!lastGame && ` for ${lastGame.visitorTeam?.TeamName} @ ${lastGame.homeTeam?.TeamName} game`}
            </Label>
            <Input
              aria-label="Last score of week for tiebreaker"
              className="bg-card"
              defaultValue={tiebreaker.TiebreakerLastScore ?? 0}
              id="tiebreakerScore"
              min="1"
              name="tiebreakerLastScore"
              onBlur={updateTiebreakerScore}
              pattern="[0-9]*"
              placeholder={`Guess the total final score${
                lastGame ? ` of the ${lastGame.visitorTeam?.TeamName} @ ${lastGame.homeTeam?.TeamName} game` : ""
              }`}
              required
              type="text"
            />
            {!!tiebreakerLastScoreError && <div className="text-danger fs-6">{tiebreakerLastScoreError}</div>}
          </div>
        </PicksBoard>
      </div>
      {!!callback && <ConfirmationModal {...callback} onCancel={onCancelCallback} />}
      <PickActionsBar
        loading={loading}
        onAutoPick={autoPick}
        onResetClick={confirmReset}
        onSave={savePicks}
        onSubmitClick={confirmSubmit}
        picksUpdating={picksUpdating}
        sidebarOpen={open}
      />
      {loading !== null && (
        <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className={cn("size-40")} role="alert">
            <PiFootballDuotone aria-hidden="true" className="animate-spin size-40 text-orange-950" />
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}
    </>
  );
};

export default MakePicksClient;
