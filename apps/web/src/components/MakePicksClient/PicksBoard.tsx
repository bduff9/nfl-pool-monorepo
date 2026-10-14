import type { DragStart, DropResult } from "@hello-pangea/dnd";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { Dispatch, FC, ReactNode, RefObject, SetStateAction } from "react";
import { Fragment, useEffect, useRef, useState } from "react";

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

// Marks the list's rows that are not wholly in its scrolled view. A reset or an auto pick leaves their chips out of the
// flight (see globals.css): their snapshots would be drawn unclipped, over the bank or the actions bar.
const useMarkRowsOutOfView = (scrollerRef: RefObject<HTMLElement | null>): void => {
  useEffect(() => {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.toggleAttribute("data-out-of-view", entry.intersectionRatio < 0.99);
        }
      },
      { root: scroller, threshold: 0.99 },
    );

    for (const row of scroller.children) {
      observer.observe(row);
    }

    return () => observer.disconnect();
  }, [scrollerRef]);
};

// fallow-ignore-next-line complexity -- row selection, lazy-mounted details and the pick row wiring kept inline on purpose so the pick board stays readable; splitting this live pick path mid-season adds risk
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
  // The details are mounted on the first open and then kept, so they can roll closed again
  const [hasOpened, setHasOpened] = useState(isSelected);

  if (isSelected && !hasOpened) {
    setHasOpened(true);
  }

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
      {/* The details unroll from the row and roll back up into it, pushing the rows below down and pulling them back */}
      <div
        className={cn(
          "grid motion-safe:transition-[grid-template-rows,opacity] motion-safe:duration-(--duration-move) motion-safe:ease-(--ease-out-quint)",
          isSelected ? "grid-rows-[1fr]" : "grid-rows-[0fr] opacity-0",
        )}
        inert={!isSelected}
      >
        <div className="min-h-0 overflow-hidden">{hasOpened ? <TeamDetail game={pick} onClose={onClose} /> : null}</div>
      </div>
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
  useMarkRowsOutOfView(scrollerRef);

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
