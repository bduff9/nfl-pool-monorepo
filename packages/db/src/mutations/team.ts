import { ADMIN_USER } from "@nfl-pool-monorepo/utils/constants";

import type { ApiTeam } from "./../../../api/src/zod";
import { db } from "../kysely";

export const updateTeamByeWeeks = async (week: number): Promise<void> => {
  await db
    .updateTable("Teams")
    .set({ TeamByeWeek: week, TeamUpdatedBy: ADMIN_USER })
    .where((eb) =>
      eb(
        "TeamID",
        "not in",
        eb
          .selectFrom("Games")
          .select("HomeTeamID as TeamID")
          .where("GameWeek", "=", week)
          .union(eb.selectFrom("Games").select("VisitorTeamID as TeamID").where("GameWeek", "=", week)),
      ),
    )
    .where("TeamCity", "!=", "Tie")
    .executeTakeFirstOrThrow();
};

export const updateTeamData = async (teamID: number, data: ApiTeam, week: number): Promise<void> => {
  const team = await db
    .selectFrom("Teams")
    .select(["TeamByeWeek"])
    .where("TeamID", "=", teamID)
    .executeTakeFirstOrThrow();

  await db
    .updateTable("Teams")
    .$if(!!data.passDefenseRank, (eb) => eb.set({ TeamPassDefenseRank: data.passDefenseRank }))
    .$if(!!data.passOffenseRank, (eb) => eb.set({ TeamPassOffenseRank: data.passOffenseRank }))
    .$if(!!data.rushDefenseRank, (eb) => eb.set({ TeamRushDefenseRank: data.rushDefenseRank }))
    .$if(!!data.rushOffenseRank, (eb) => eb.set({ TeamRushOffenseRank: data.rushOffenseRank }))
    .$if(!team.TeamByeWeek || team.TeamByeWeek === week, (eb) => eb.set({ TeamByeWeek: week + 1 }))
    .set({ TeamUpdated: new Date(), TeamUpdatedBy: ADMIN_USER })
    .where("TeamID", "=", teamID)
    .executeTakeFirstOrThrow();
};
