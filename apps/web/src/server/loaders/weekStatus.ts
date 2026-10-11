import type { DB } from "@nfl-pool-monorepo/db/src";
import { type Kysely, sql } from "kysely";

type StatusCounts = { Completed: number; InProgress: number; NotStarted: number };

export const gameStatusCountsQuery = (executor: Pick<Kysely<DB>, "selectFrom">) =>
  executor
    .selectFrom("Games")
    .select([
      sql<number>`sum(case when GameStatus = 'Pregame' then 1 else 0 end)`.as("NotStarted"),
      sql<number>`sum(case when GameStatus = 'Final' then 1 else 0 end)`.as("Completed"),
      sql<number>`sum(case when GameStatus not in ('Pregame', 'Final') then 1 else 0 end)`.as("InProgress"),
    ]);

export const toSeasonStatus = ({ Completed, InProgress, NotStarted }: StatusCounts) => {
  if (Number(Completed) + Number(InProgress) === 0) {
    return "Not Started";
  }

  if (Number(NotStarted) + Number(InProgress) === 0) {
    return "Complete";
  }

  return "In Progress";
};
