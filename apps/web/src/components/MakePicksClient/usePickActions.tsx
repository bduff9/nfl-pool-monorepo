import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { type FocusEventHandler, type ReactNode, useRef, useState } from "react";
import { toast } from "sonner";

import type { AutoPickStrategy } from "@/lib/constants";
import { autoPickMyPicks, resetMyPicksForWeek, submitMyPicks, validateMyPicks } from "@/server/actions/pick";
import { updateMyTiebreakerScore } from "@/server/actions/tiebreaker";
import type { getMyWeeklyPicks } from "@/server/loaders/pick";
import type { getMyTiebreaker } from "@/server/loaders/tiebreaker";

import type { LoadingType } from "./MakePicksClient";

type ConfirmCallback = {
  acceptButton: string;
  body: ReactNode;
  onAccept: () => Promise<void>;
  title: string;
};

type UsePickActionsArgs = {
  available: Array<number>;
  lastGame: Awaited<ReturnType<typeof getMyWeeklyPicks>>[number] | undefined;
  optimisticPicks: Awaited<ReturnType<typeof getMyWeeklyPicks>>;
  selectedWeek: number;
  setOptimisticPicks: (picks: Awaited<ReturnType<typeof getMyWeeklyPicks>>) => void;
  startPicksUpdating: (callback: () => void) => void;
  tiebreaker: NonNullable<Awaited<ReturnType<typeof getMyTiebreaker>>>;
};

export const usePickActions = ({
  available,
  lastGame,
  optimisticPicks,
  selectedWeek,
  setOptimisticPicks,
  startPicksUpdating,
  tiebreaker,
}: UsePickActionsArgs) => {
  const router = useRouter();
  const [loading, setLoading] = useState<LoadingType | null>(null);
  const [tiebreakerLastScoreError, setTiebreakerLastScoreError] = useState<null | string>(null);
  const [callback, setCallback] = useState<ConfirmCallback | null>(null);
  const toastIdRef = useRef<string | number | undefined>(undefined);

  const { execute: executeUpdateTiebreaker } = useAction(updateMyTiebreakerScore, {
    onError: ({ error }) => {
      toast.error("Something went wrong!", {
        description: error.serverError ?? "Please check the information you are submitting.",
      });
    },
  });

  const { execute: executeResetPicks } = useAction(resetMyPicksForWeek, {
    onError: ({ error }) => {
      toast.error("Something went wrong!", {
        description: error.serverError ?? "Please check the information you are submitting.",
      });
    },
    onSettled: () => {
      setLoading(null);
      setCallback(null);
    },
    onSuccess: () => {
      toast.success(`Successfully reset your picks for week ${selectedWeek}`);
    },
  });

  const { execute: executeAutoPick } = useAction(autoPickMyPicks, {
    onError: ({ error }) => {
      toast.error("Something went wrong!", {
        description: error.serverError ?? "Please check the information you are submitting.",
      });
    },
    onSettled: () => {
      if (toastIdRef.current) toast.dismiss(toastIdRef.current);
      setLoading(null);
    },
    onSuccess: () => {
      toast.success(`Successfully auto picked your picks for week ${selectedWeek}`);
    },
  });

  const { execute: executeValidatePicks } = useAction(validateMyPicks, {
    onError: ({ error }) => {
      toast.error("Something went wrong!", {
        description: error.serverError ?? "Please check the information you are submitting.",
      });
    },
    onSettled: () => {
      if (toastIdRef.current) toast.dismiss(toastIdRef.current);
      setLoading(null);
    },
    onSuccess: () => {
      toast.success(
        <>
          <div className="mb-3">Successfully saved your picks for week {selectedWeek}!</div>
          <div>
            Please note that you will still need to submit your picks when ready as they are only saved, not submitted.
          </div>
        </>,
      );
    },
  });

  const { execute: executeSubmitPicks } = useAction(submitMyPicks, {
    onError: ({ error }) => {
      toast.error("Something went wrong!", {
        description: error.serverError ?? "Please check the information you are submitting.",
      });
    },
    onSettled: () => {
      if (toastIdRef.current) toast.dismiss(toastIdRef.current);
      setLoading(null);
      setCallback(null);
    },
    onSuccess: () => {
      toast.success(`Successfully submitted your picks for week ${selectedWeek}`);
      router.push("/picks/view");
    },
  });

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

    startPicksUpdating(() => {
      executeUpdateTiebreaker({
        score: tiebreakerLastScore,
        week: selectedWeek,
      });
    });
  };

  const resetPicks = async (): Promise<void> => {
    setLoading("reset");
    startPicksUpdating(() => {
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

      executeResetPicks({ week: selectedWeek });
    });
  };

  const autoPick = (type: (typeof AutoPickStrategy)[number]): void => {
    setLoading("autopick");
    toastIdRef.current = toast.loading("Auto picking...", {
      closeButton: false,
      dismissible: false,
      duration: Infinity,
    });
    executeAutoPick({ type, week: selectedWeek });
  };

  const savePicks = (): void => {
    setLoading("save");
    toastIdRef.current = toast.loading("Saving...", {
      closeButton: false,
      dismissible: false,
      duration: Infinity,
    });
    executeValidatePicks({
      lastScore: tiebreaker.TiebreakerLastScore ?? 0,
      unused: available,
      week: selectedWeek,
    });
  };

  const confirmReset = (): void => {
    setCallback({
      acceptButton: "Reset",
      body: (
        <>
          <div className="mb-3">Are you sure you want to reset all your picks?</div>
          <small>
            Note: Any games that have already started will not be affected. Only games that have not kicked off yet will
            be reset.
          </small>
        </>
      ),
      onAccept: resetPicks,
      title: "Are you sure you want to reset?",
    });
  };

  const submitPicks = async (): Promise<void> => {
    setLoading("submit");

    if (available.length > 0) {
      toast.error("Something went wrong!", {
        description: "Missing point value found! Please use all points before submitting",
      });
      setLoading(null);
      setCallback(null);

      return;
    }

    const lastGameHasStarted = lastGame && lastGame.GameKickoff < new Date();

    if ((tiebreaker.TiebreakerLastScore ?? 0) < 1 && !lastGameHasStarted) {
      toast.error("Something went wrong!", {
        description: "Tiebreaker last score must be greater than zero",
      });
      setLoading(null);
      setCallback(null);

      return;
    }

    toastIdRef.current = toast.loading("Submitting...", {
      closeButton: false,
      dismissible: false,
      duration: Infinity,
    });
    executeSubmitPicks({ week: selectedWeek });
  };

  const confirmSubmit = (): void => {
    setCallback({
      acceptButton: "Submit",
      body: (
        <>
          <div className="mb-3">Are you sure you are ready to submit?</div>
          <small>
            Note: You will be unable to make any more changes to this week&apos;s picks once submitted and this cannot
            be undone.
          </small>
        </>
      ),
      onAccept: submitPicks,
      title: "Are you ready to submit?",
    });
  };

  return {
    autoPick,
    callback,
    confirmReset,
    confirmSubmit,
    loading,
    savePicks,
    setCallback,
    tiebreakerLastScoreError,
    updateTiebreakerScore,
  };
};
