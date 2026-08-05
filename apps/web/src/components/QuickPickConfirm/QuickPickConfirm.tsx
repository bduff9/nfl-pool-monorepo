"use client";
import "client-only";

import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { type FC, useCallback, useState } from "react";
import { toast } from "sonner";

import { quickPick } from "@/server/actions/pick";

type Props = {
  teamId: number;
  teamLabel: string;
  userId: number;
};

const QuickPickConfirm: FC<Props> = ({ teamId, teamLabel, userId }) => {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { execute, isPending } = useAction(quickPick, {
    onError: ({ error }) => {
      const message = error.serverError ?? "Something went wrong, please try again.";
      setErrorMessage(message);
      toast.error("Quick pick failed!", { description: message });
    },
    onSuccess: () => {
      toast.success("Successfully made your quick pick!");
      router.push("/picks/set");
    },
  });

  const handleConfirm = useCallback(() => {
    setErrorMessage(null);
    execute({ teamId, userId });
  }, [execute, teamId, userId]);

  return (
    <div className="text-center">
      <p className="mb-4">
        Click below to set <strong>{teamLabel}</strong> as your quick pick for this week.
      </p>
      <Button disabled={isPending} onClick={handleConfirm} variant="primary">
        {isPending ? "Submitting..." : "Confirm Quick Pick"}
      </Button>
      {!!errorMessage && <p className="mt-4 text-red-600">{errorMessage}</p>}
    </div>
  );
};

export default QuickPickConfirm;
