import type { DragStart, DropResult } from "@hello-pangea/dnd";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { Dispatch, FC, SetStateAction } from "react";
import { Fragment, useCallback } from "react";

import type { getMyWeeklyPicks } from "@/server/loaders/pick";

import PickGame, { Point } from "../PickGame/PickGame";
import TeamDetail from "../TeamDetail/TeamDetail";
import type { LoadingType } from "./MakePicksClient";

type PicksBoardProps = {
  available: Array<number>;
  dragGameID: null | string;
  loading: LoadingType | null;
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
  pick: Awaited<ReturnType<typeof getMyWeeklyPicks>>[number];
  selectedGame: null | number;
  setSelectedGame: Dispatch<SetStateAction<null | number>>;
};

const PickGameRow: FC<PickGameRowProps> = ({ dragGameID, gameCount, loading, pick, selectedGame, setSelectedGame }) => {
  const isSelected = pick.GameID === selectedGame;

  const onClick = useCallback(() => {
    setSelectedGame((gameID) => (gameID === pick.GameID ? null : pick.GameID));
  }, [pick.GameID, setSelectedGame]);

  const onClose = useCallback(() => {
    setSelectedGame(null);
  }, [setSelectedGame]);

  return (
    <Fragment>
      <PickGame
        dragGameID={dragGameID}
        gameCount={gameCount}
        isBackgrounded={!!selectedGame && pick.GameID !== selectedGame}
        isSelected={isSelected}
        loading={loading}
        onClick={onClick}
        pick={pick}
      />
      {isSelected && <TeamDetail game={pick} onClose={onClose} />}
    </Fragment>
  );
};

export const PicksBoard: FC<PicksBoardProps> = ({
  available,
  dragGameID,
  loading,
  onDragEnd,
  onDragStart,
  optimisticPicks,
  selectedGame,
  setSelectedGame,
}) => {
  return (
    <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
      <Droppable direction="horizontal" droppableId="pointBank">
        {(provided, snapshot) => (
          <div
            className={cn(
              "w-full flex flex-wrap justify-center items-center p-3 mb-3 sticky top-0 min-h-[92px] bg-gray-100 gap-1 z-10",
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
      <div className="w-full mb-3">
        {optimisticPicks.map((pick) => (
          <PickGameRow
            dragGameID={dragGameID}
            gameCount={optimisticPicks.length}
            key={`pick-id-${pick.PickID}`}
            loading={loading}
            pick={pick}
            selectedGame={selectedGame}
            setSelectedGame={setSelectedGame}
          />
        ))}
      </div>
    </DragDropContext>
  );
};
