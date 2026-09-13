"use client";

import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { Input } from "@nfl-pool-monorepo/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@nfl-pool-monorepo/ui/components/select";
import { TableCell, TableRow } from "@nfl-pool-monorepo/ui/components/table";
import { useAction } from "next-safe-action/hooks";
import type { FC } from "react";
import { toast } from "sonner";

import { adminUpdateGame } from "@/server/actions/games";

const GAME_STATUSES = [
  "Pregame",
  "1st Quarter",
  "2nd Quarter",
  "Half Time",
  "3rd Quarter",
  "4th Quarter",
  "Overtime",
  "Final",
  "Invalid",
] as const;

type AdminGameRowProps = {
  away: string;
  gameID: number;
  home: string;
  homeScore: number;
  kickoffLabel: string;
  status: string;
  visitorScore: number;
};

const AdminGameRow: FC<AdminGameRowProps> = ({ away, gameID, home, homeScore, kickoffLabel, status, visitorScore }) => {
  const { execute, isPending } = useAction(adminUpdateGame, {
    onError: ({ error }) => {
      toast.error("Failed to update game", { description: error.serverError ?? "Please try again." });
    },
    onSuccess: () => {
      toast.success(`Game ${gameID} updated`);
    },
  });

  const handleSubmit = (formData: FormData): void => {
    const homeScoreValue = Number(formData.get("homeScore"));
    const statusValue = String(formData.get("status") ?? status);
    const visitorScoreValue = Number(formData.get("visitorScore"));

    execute({
      gameID,
      homeScore: Number.isNaN(homeScoreValue) ? 0 : homeScoreValue,
      status: statusValue as (typeof GAME_STATUSES)[number],
      visitorScore: Number.isNaN(visitorScoreValue) ? 0 : visitorScoreValue,
    });
  };

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap align-middle">
        {away} @ {home}
        <div className="text-xs text-muted-foreground">{kickoffLabel}</div>
      </TableCell>
      <TableCell className="align-middle">
        <form action={handleSubmit} className="flex flex-wrap items-center justify-end gap-2">
          <Input
            aria-label={`${away} score`}
            className="w-20"
            defaultValue={visitorScore}
            name="visitorScore"
            type="number"
          />
          <Input
            aria-label={`${home} score`}
            className="w-20"
            defaultValue={homeScore}
            name="homeScore"
            type="number"
          />
          <Select defaultValue={status} name="status">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GAME_STATUSES.map((gameStatus) => (
                <SelectItem key={gameStatus} value={gameStatus}>
                  {gameStatus}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button disabled={isPending} type="submit" variant="primary">
            {isPending ? "Saving..." : "Save"}
          </Button>
        </form>
      </TableCell>
    </TableRow>
  );
};

export default AdminGameRow;
