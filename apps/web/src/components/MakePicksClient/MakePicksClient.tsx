"use client";

import type { DragStart, DropResult } from "@hello-pangea/dnd";
import { Input } from "@nfl-pool-monorepo/ui/components/input";
import { Label } from "@nfl-pool-monorepo/ui/components/label";
import { useSidebar } from "@nfl-pool-monorepo/ui/components/sidebar";

import { onActionError } from "@/lib/actionErrorToast";
import { hapticTap } from "@/lib/haptics";
import { useNow } from "@/lib/hooks/useNow";
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
import {
  getAvailablePoints,
  getBoardPicks,
  getLastGameMatchup,
  getTiebreakerPlaceholder,
  isDropMove,
  type PendingReset,
  placePoints,
  resolveDrop,
} from "./pickPlacement";
import { usePickActions } from "./usePickActions";

const ConfirmationModal = dynamic(() => import("../ConfirmationModal/ConfirmationModal"), { ssr: false });

export type LoadingType = "autopick" | "reset" | "save" | "submit";

type Props = {
  selectedWeek: number;
  tiebreaker: NonNullable<Awaited<ReturnType<typeof getMyTiebreaker>>>;
  weeklyPicks: Awaited<ReturnType<typeof getMyWeeklyPicks>>;
};

type TiebreakerFieldProps = {
  error: ReturnType<typeof usePickActions>["tiebreakerLastScoreError"];
  lastGame: Awaited<ReturnType<typeof getMyWeeklyPicks>>[number] | undefined;
  lastScore: null | number;
  onBlur: ReturnType<typeof usePickActions>["updateTiebreakerScore"];
};

const TiebreakerField: FC<TiebreakerFieldProps> = ({ error, lastGame, lastScore, onBlur }) => {
  const matchup = getLastGameMatchup(lastGame);

  return (
    <div className="w-full my-3 md:px-5">
      <Label className="required" htmlFor="tiebreakerScore">
        Tiebreaker Score
        {!!matchup && ` for ${matchup} game`}
      </Label>
      <Input
        aria-label="Last score of week for tiebreaker"
        className="bg-card"
        defaultValue={lastScore ?? 0}
        id="tiebreakerScore"
        min="1"
        name="tiebreakerLastScore"
        onBlur={onBlur}
        pattern="[0-9]*"
        placeholder={getTiebreakerPlaceholder(matchup)}
        required
        type="text"
      />
      {!!error && <div className="text-danger fs-6">{error}</div>}
    </div>
  );
};

const LoadingSpinner: FC<{ loading: LoadingType | null }> = ({ loading }) =>
  loading === null ? null : (
    <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
      <div role="alert">
        <PiFootballDuotone aria-hidden="true" className="size-10 animate-spin text-primary" />
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );

const MakePicksClient: FC<Props> = ({ selectedWeek, tiebreaker, weeklyPicks }) => {
  const { open } = useSidebar();
  const [selectedGame, setSelectedGame] = useState<null | number>(null);
  const [dragGameID, setDragGameID] = useState<null | string>(null);
  const [droppedPicks, setDroppedPicks] = useOptimistic(weeklyPicks);
  // The server's picks a reset is being saved against. Until fresh picks arrive the board shows them reset. This is state
  // set in a transition rather than an optimistic update, whose urgent render never starts a view transition, so the
  // chips fly back to the bank (and out again if the reset fails).
  const [resetFrom, setResetFrom] = useState<null | PendingReset>(null);
  const [picksUpdating, startPicksUpdating] = useTransition();
  const now = useNow() ?? new Date(0);
  const optimisticPicks = getBoardPicks(resetFrom, weeklyPicks, droppedPicks);
  const lastGame = optimisticPicks[optimisticPicks.length - 1];

  const { execute: executeSetMyPick } = useAction(setMyPick, {
    onError: onActionError,
  });

  const onDragEnd = (result: DropResult): void => {
    const { draggableId, source, destination } = result;

    setDragGameID(null);

    if (!isDropMove(source, destination)) {
      return;
    }

    hapticTap();

    const { gameID, points, pickTeam, teamID } = resolveDrop(
      optimisticPicks,
      draggableId,
      source.droppableId,
      destination.droppableId,
    );

    startPicksUpdating(() => {
      setDroppedPicks((picks) => placePoints(picks, gameID, points, pickTeam, new Date()));

      executeSetMyPick({ gameID, points, teamID, week: selectedWeek });
    });
  };

  const onDragStart = (initial: DragStart): void => {
    const {
      source: { droppableId },
    } = initial;

    hapticTap();
    setDragGameID(droppableId.replace("home-", "").replace("visitor-", ""));
  };

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
    selectedWeek,
    setResetFrom,
    startPicksUpdating,
    tiebreaker,
    weeklyPicks,
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
          <TiebreakerField
            error={tiebreakerLastScoreError}
            lastGame={lastGame}
            lastScore={tiebreaker.TiebreakerLastScore}
            onBlur={updateTiebreakerScore}
          />
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
      <LoadingSpinner loading={loading} />
    </>
  );
};

export default MakePicksClient;
