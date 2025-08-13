"use client";

import type { DragStart, DropResult } from "@hello-pangea/dnd";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { Button } from "@nfl-pool-monorepo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@nfl-pool-monorepo/ui/components/dropdown-menu";
import { Input } from "@nfl-pool-monorepo/ui/components/input";
import { Label } from "@nfl-pool-monorepo/ui/components/label";
import { useSidebar } from "@nfl-pool-monorepo/ui/components/sidebar";
import { cn } from "@nfl-pool-monorepo/utils/styles";

import type { AutoPickStrategy } from "@/lib/constants";
import { parseDragData } from "@/lib/strings";
import { processFormState } from "@/lib/zsa";
import { autoPickMyPicks, resetMyPicksForWeek, setMyPick, submitMyPicks, validateMyPicks } from "@/server/actions/pick";
import { updateMyTiebreakerScore } from "@/server/actions/tiebreaker";
import type { getMyWeeklyPicks } from "@/server/loaders/pick";
import type { getMyTiebreaker } from "@/server/loaders/tiebreaker";
import "client-only";

import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import type { FC, FocusEventHandler, ReactNode } from "react";
import { Fragment, useCallback, useOptimistic, useState, useTransition } from "react";
import { FaCloudUploadAlt, FaRedo, FaSave } from "react-icons/fa";
import { PiFootballDuotone, PiRobotDuotone } from "react-icons/pi";
import { toast } from "sonner";

import PickGame, { Point } from "../PickGame/PickGame";
import TeamDetail from "../TeamDetail/TeamDetail";

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
  const [tiebreakerLastScoreError, setTiebreakerLastScoreError] = useState<null | string>(null);
  const [optimisticPicks, setOptimisticPicks] = useOptimistic(weeklyPicks);
  const [picksUpdating, startPicksUpdating] = useTransition();
  const [loading, setLoading] = useState<LoadingType | null>(null);
  const [callback, setCallback] = useState<{
    acceptButton: string;
    body: ReactNode;
    onAccept: () => Promise<void>;
    title: string;
  } | null>(null);
  const lastGame = optimisticPicks[optimisticPicks.length - 1];

  const onDragEnd = useCallback(
    (result: DropResult): void => {
      const { draggableId, source, destination } = result;

      setDragGameID(null);

      if (!destination) {
        return;
      }

      if (source.droppableId === destination.droppableId) {
        return;
      }

      const [points, , destinationData] = parseDragData(draggableId, source.droppableId, destination.droppableId);
      const gameID = destinationData?.gameID ?? null;
      const pick = optimisticPicks.find((pick) => pick.GameID === gameID);
      const pickTeam =
        destinationData?.type === "home"
          ? (pick?.homeTeam ?? null)
          : destinationData?.type === "visitor"
            ? (pick?.visitorTeam ?? null)
            : null;

      startPicksUpdating(async () => {
        setOptimisticPicks((picks) =>
          picks.map((pick) => {
            if (pick.GameKickoff < new Date()) {
              return pick;
            }

            if (gameID === pick.GameID) {
              return {
                ...pick,
                PickPoints: points,
                pickTeam,
                TeamID: pickTeam?.TeamID ?? null,
              };
            }

            if (points === pick.PickPoints) {
              return {
                ...pick,
                PickPoints: null,
                pickTeam: null,
                TeamID: null,
              };
            }

            return pick;
          }),
        );

        const result = await setMyPick({
          gameID,
          points,
          teamID: pickTeam?.TeamID ?? null,
          week: selectedWeek,
        });

        processFormState(result);
      });
    },
    [optimisticPicks, selectedWeek, setOptimisticPicks],
  );

  const onDragStart = useCallback((initial: DragStart): void => {
    const {
      source: { droppableId },
    } = initial;

    setDragGameID(droppableId.replace("home-", "").replace("visitor-", ""));
  }, []);

  const used = optimisticPicks
    .map((pick): number => (pick.PickPoints && pick.pickTeam ? pick.PickPoints : 0))
    .filter((point) => point > 0);
  const unavailable = optimisticPicks
    .map((pick): number => {
      const kickoff = pick.GameKickoff;
      const now = new Date();

      if (!pick.pickTeam && now.getTime() > kickoff.getTime()) {
        return pick.PickPoints ?? 0;
      }

      return 0;
    })
    .filter((point) => point > 0);
  const allUsed = used.concat(unavailable);
  const available: Array<number> = [];

  for (let i = 1; i <= optimisticPicks.length; i++) {
    if (!allUsed.includes(i)) available.push(i);
  }

  const updateTiebreakerScore: FocusEventHandler<HTMLInputElement> = async (event) => {
    const tiebreakerLastScore = +event.currentTarget.value;

    if (Number.isNaN(tiebreakerLastScore)) {
      setTiebreakerLastScoreError("Please enter a valid number");

      return;
    }

    if (tiebreakerLastScore < 1) {
      setTiebreakerLastScoreError("Tiebreaker score must be greater than 0");

      return;
    }

    setTiebreakerLastScoreError(null);

    startPicksUpdating(async () => {
      const result = await updateMyTiebreakerScore({
        score: tiebreakerLastScore,
        week: selectedWeek,
      });

      processFormState(result);
    });
  };

  const resetPicks = async (): Promise<void> => {
    setLoading("reset");
    startPicksUpdating(async () => {
      setOptimisticPicks(
        optimisticPicks.map((pick) => {
          if (pick.GameKickoff > new Date()) {
            return {
              ...pick,
              PickPoints: null,
              pickTeam: null,
              TeamID: null,
            };
          }

          return pick;
        }),
      );

      const result = await resetMyPicksForWeek({ week: selectedWeek });

      processFormState(
        result,
        () => {
          /* NOOP */
        },
        `Successfully reset your picks for week ${selectedWeek}`,
      );
      setLoading(null);
      setCallback(null);
    });
  };

  const autoPick = async (type: (typeof AutoPickStrategy)[number]): Promise<void> => {
    setLoading("autopick");
    const toastId = toast.loading("Auto picking...", {
      closeButton: false,
      dismissible: false,
      duration: Infinity,
    });
    const result = await autoPickMyPicks({ type, week: selectedWeek });

    processFormState(
      result,
      () => {
        /* NOOP */
      },
      `Successfully auto picked your picks for week ${selectedWeek}`,
    );
    toast.dismiss(toastId);
    setLoading(null);
  };

  const savePicks = async (): Promise<void> => {
    setLoading("save");
    const toastId = toast.loading("Saving...", {
      closeButton: false,
      dismissible: false,
      duration: Infinity,
    });
    const result = await validateMyPicks({
      lastScore: tiebreaker.TiebreakerLastScore ?? 0,
      unused: available,
      week: selectedWeek,
    });

    processFormState(
      result,
      () => {
        /* NOOP */
      },
      <>
        <div className="mb-3">Successfully saved your picks for week {selectedWeek}!</div>
        <div>
          Please note that you will still need to submit your picks when ready as they are only saved, not submitted.
        </div>
      </>,
    );
    toast.dismiss(toastId);
    setLoading(null);
  };

  const submitPicks = async (): Promise<void> => {
    setLoading("submit");
    const toastId = toast.loading("Submitting...", {
      closeButton: false,
      dismissible: false,
      duration: Infinity,
    });

    try {
      if (available.length > 0) {
        toast.error("Something went wrong!", {
          description: "Missing point value found! Please use all points before submitting",
        });

        return;
      }

      const lastGameHasStarted = lastGame && lastGame.GameKickoff < new Date();

      if ((tiebreaker.TiebreakerLastScore ?? 0) < 1 && !lastGameHasStarted) {
        toast.error("Something went wrong!", {
          description: "Tiebreaker last score must be greater than zero",
        });

        return;
      }

      const result = await submitMyPicks({ week: selectedWeek });

      processFormState(
        result,
        () => {
          redirect("/picks/view");
        },
        `Successfully submitted your picks for week ${selectedWeek}`,
      );
    } finally {
      toast.dismiss(toastId);
      setLoading(null);
      setCallback(null);
    }
  };

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <h4 className="w-full mb-3 text-center shrink-1">
          Drag points to your chosen winning team or click a team to see the game details
        </h4>
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
              <Fragment key={`pick-id-${pick.PickID}`}>
                <PickGame
                  dragGameID={dragGameID}
                  gameCount={optimisticPicks.length}
                  isBackgrounded={!!selectedGame && pick.GameID !== selectedGame}
                  isSelected={pick.GameID === selectedGame}
                  loading={loading}
                  onClick={() => setSelectedGame((gameID) => (gameID === pick.GameID ? null : pick.GameID))}
                  pick={pick}
                />
                {pick.GameID === selectedGame && <TeamDetail game={pick} onClose={() => setSelectedGame(null)} />}
              </Fragment>
            ))}
          </div>
        </DragDropContext>
        <div className="w-full mb-3 md:px-5">
          <Label className="required" htmlFor="tiebreakerScore">
            Tiebreaker Score
            {lastGame && ` for ${lastGame.visitorTeam?.TeamName} @ ${lastGame.homeTeam?.TeamName} game`}
          </Label>
          <Input
            aria-label="Last score of week for tiebreaker"
            className="dark:bg-white"
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
          {tiebreakerLastScoreError && <div className="text-danger fs-6">{tiebreakerLastScoreError}</div>}
        </div>
      </div>
      {callback && <ConfirmationModal {...callback} onCancel={() => setCallback(null)} />}
      <div
        className={cn(
          "fixed flex justify-around content-center bottom-0 end-0 w-full h-[70px] z-[49] bg-black",
          open ? "md:w-[calc(100%-16rem)]" : "md:w-full",
        )}
      >
        <div className="w-1/4 px-1 md:px-2">
          <Button
            className="w-full my-3"
            disabled={loading !== null || picksUpdating}
            onClick={() => {
              setCallback({
                acceptButton: "Reset",
                body: (
                  <>
                    <div className="mb-3">Are you sure you want to reset all your picks?</div>
                    <small>
                      Note: Any games that have already started will not be affected. Only games that have not kicked
                      off yet will be reset.
                    </small>
                  </>
                ),
                onAccept: resetPicks,
                title: "Are you sure you want to reset?",
              });
            }}
            type="button"
            variant="danger"
          >
            {loading === "reset" ? (
              <>
                <PiFootballDuotone aria-hidden="true" className="animate-spin hidden md:inline-block" />
                Resetting...
              </>
            ) : (
              <>
                <div className="md:block hidden">
                  <FaRedo />
                </div>
                Reset
              </>
            )}
          </Button>
        </div>
        <div className="w-1/4 px-1 md:px-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="text-nowrap w-full my-3"
                disabled={loading !== null || picksUpdating}
                id="auto-pick-button"
                type="button"
                variant="secondary"
              >
                {loading === "autopick" ? (
                  <>
                    <PiFootballDuotone aria-hidden="true" className="animate-spin hidden md:inline-block" />
                    Picking...
                  </>
                ) : (
                  <>
                    <div className="md:block hidden">
                      <PiRobotDuotone />
                    </div>
                    Auto Pick
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => autoPick("Away")}>Away</DropdownMenuItem>
                <DropdownMenuItem onClick={() => autoPick("Home")}>Home</DropdownMenuItem>
                <DropdownMenuItem onClick={() => autoPick("Random")}>Random</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="w-1/4 px-1 md:px-2">
          <Button
            className="w-full my-3"
            disabled={loading !== null || picksUpdating}
            onClick={savePicks}
            type="button"
            variant="primary"
          >
            {loading === "save" ? (
              <>
                <PiFootballDuotone aria-hidden="true" className="animate-spin hidden md:inline-block" />
                Saving...
              </>
            ) : (
              <>
                <div className="md:block hidden">
                  <FaSave />
                </div>
                Save
              </>
            )}
          </Button>
        </div>
        <div className="w-1/4 px-1 md:px-2">
          <Button
            className="w-full my-3"
            disabled={loading !== null || picksUpdating}
            onClick={() =>
              setCallback({
                acceptButton: "Submit",
                body: (
                  <>
                    <div className="mb-3">Are you sure you are ready to submit?</div>
                    <small>
                      Note: You will be unable to make any more changes to this week&apos;s picks once submitted and
                      this cannot be undone.
                    </small>
                  </>
                ),
                onAccept: submitPicks,
                title: "Are you ready to submit?",
              })
            }
            type="button"
            variant="success"
          >
            {loading === "submit" ? (
              <>
                <PiFootballDuotone aria-hidden="true" className="animate-spin hidden md:inline-block" />
                Submitting...
              </>
            ) : (
              <>
                <div className="md:block hidden">
                  <FaCloudUploadAlt />
                </div>
                Submit
              </>
            )}
          </Button>
        </div>
      </div>
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
