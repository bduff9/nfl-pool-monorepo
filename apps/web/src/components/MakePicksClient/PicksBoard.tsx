import type { DragStart, DropResult } from "@hello-pangea/dnd";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { Dispatch, FC, ReactNode, SetStateAction } from "react";
import { Fragment, useRef } from "react";

import { useDragAutoScroll } from "@/lib/hooks/useDragAutoScroll";
import type { getMyWeeklyPicks } from "@/server/loaders/pick";

import PickGame, { Point } from "../PickGame/PickGame";
import TeamDetail from "../TeamDetail/TeamDetail";
import type { LoadingType } from "./MakePicksClient";

type PicksBoardProps = {
  available: Array<number>;
  children?: ReactNode;
  dragGameID: null | string;
  loading: LoadingType | null;
  now: Date;
  onDragEnd: (result: DropResult) => void;
  onDragStart: (initial: DragStart) => void;
  optimisticPicks: Awaited<ReturnType<typeof getMyWeeklyPicks>>;
  selectedGame: null | number;
  setSelectedGame: Dispatch<SetStateAction<null | number>>;
};

type PickGameRowProps = {
  dragGameID: null | string;
  gameCount: number;
  loading: LoadingType | null;
  now: Date;
  pick: Awaited<ReturnType<typeof getMyWeeklyPicks>>[number];
  selectedGame: null | number;
  setSelectedGame: Dispatch<SetStateAction<null | number>>;
};

const PickGameRow: FC<PickGameRowProps> = ({
  dragGameID,
  gameCount,
  loading,
  now,
  pick,
  selectedGame,
  setSelectedGame,
}) => {
  const isSelected = pick.GameID === selectedGame;

  const onClick = () => {
    setSelectedGame((gameID) => (gameID === pick.GameID ? null : pick.GameID));
  };

  const onClose = () => {
    setSelectedGame(null);
  };

  return (
    <Fragment>
      <PickGame
        dragGameID={dragGameID}
        gameCount={gameCount}
        isBackgrounded={!!selectedGame && pick.GameID !== selectedGame}
        isSelected={isSelected}
        loading={loading}
        now={now}
        onClick={onClick}
        pick={pick}
      />
      {isSelected && <TeamDetail game={pick} onClose={onClose} />}
    </Fragment>
  );
};

export const PicksBoard: FC<PicksBoardProps> = ({
  available,
  children,
  dragGameID,
  loading,
  now,
  onDragEnd,
  onDragStart,
  optimisticPicks,
  selectedGame,
  setSelectedGame,
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useDragAutoScroll(scrollerRef, dragGameID !== null);

  // The point bank must not be sticky: dnd measures droppables in page coordinates and assumes they scroll with the
  // window, so a sticky bank's drop zone drifts away from where it is drawn. Instead the bank stays in normal flow and
  // only the game list scrolls, filling the rest of the viewport-height page (see the picks page wrapper).
  return (
    <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
      <Droppable direction="horizontal" droppableId="pointBank">
        {(provided, snapshot) => (
          <div
            className={cn(
              "w-full flex flex-wrap justify-center items-center p-3 mb-3 min-h-[92px] shrink-0 bg-muted gap-1",
              snapshot.isDraggingOver && "bg-blue-300",
            )}
            ref={provided.innerRef}
          >
            {available.map((point, index) => (
              <Point
                index={index}
                isDragDisabled={loading !== null}
                key={`point-${point}`}
                maxValue={optimisticPicks.length}
                value={point}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <div className="w-full flex-1 min-h-0 overflow-y-auto overscroll-contain" ref={scrollerRef}>
        {optimisticPicks.map((pick) => (
          <PickGameRow
            dragGameID={dragGameID}
            gameCount={optimisticPicks.length}
            key={`pick-id-${pick.PickID}`}
            loading={loading}
            now={now}
            pick={pick}
            selectedGame={selectedGame}
            setSelectedGame={setSelectedGame}
          />
        ))}
        {children}
      </div>
    </DragDropContext>
  );
};
