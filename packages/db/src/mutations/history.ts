import { ADMIN_USER } from "@nfl-pool-monorepo/utils/constants";
import type { Transaction } from "kysely";

import type { DB } from "..";
import { getPublicLeague } from "../queries/league";
import { getSystemYear } from "../queries/systemValue";

export const populateWinnerHistory = async (trx: Transaction<DB>): Promise<void> => {
  const year = await getSystemYear();
  const leagueID = await getPublicLeague();

  await trx
    .insertInto("History")
    .columns([
      "UserID",
      "HistoryYear",
      "LeagueID",
      "HistoryType",
      "HistoryWeek",
      "HistoryPlace",
      "HistoryAdded",
      "HistoryAddedBy",
      "HistoryUpdated",
      "HistoryUpdatedBy",
    ])
    .expression((eb) =>
      eb
        .selectFrom("OverallMV")
        .select(({ val }) => [
          "UserID",
          val(year).as("HistoryYear"),
          val(leagueID.LeagueID).as("LeagueID"),
          val("Overall").as("HistoryType"),
          val(null).as("HistoryWeek"),
          "Rank",
          val(new Date()).as("HistoryAdded"),
          val(ADMIN_USER).as("HistoryAddedBy"),
          val(new Date()).as("HistoryUpdated"),
          val(ADMIN_USER).as("HistoryUpdatedBy"),
        ])
        .where("Rank", "<", 4),
    )
    .executeTakeFirstOrThrow();
  await trx
    .insertInto("History")
    .columns([
      "UserID",
      "HistoryYear",
      "LeagueID",
      "HistoryType",
      "HistoryWeek",
      "HistoryPlace",
      "HistoryAdded",
      "HistoryAddedBy",
      "HistoryUpdated",
      "HistoryUpdatedBy",
    ])
    .expression((eb) =>
      eb
        .selectFrom("WeeklyMV")
        .select(({ val }) => [
          "UserID",
          val(year).as("HistoryYear"),
          val(leagueID.LeagueID).as("LeagueID"),
          val("Weekly").as("HistoryType"),
          "Week",
          "Rank",
          val(new Date()).as("HistoryAdded"),
          val(ADMIN_USER).as("HistoryAddedBy"),
          val(new Date()).as("HistoryUpdated"),
          val(ADMIN_USER).as("HistoryUpdatedBy"),
        ])
        .where("Rank", "<", 3),
    )
    .executeTakeFirstOrThrow();
  await trx
    .insertInto("History")
    .columns([
      "UserID",
      "HistoryYear",
      "LeagueID",
      "HistoryType",
      "HistoryWeek",
      "HistoryPlace",
      "HistoryAdded",
      "HistoryAddedBy",
      "HistoryUpdated",
      "HistoryUpdatedBy",
    ])
    .expression((eb) =>
      eb
        .selectFrom("SurvivorMV")
        .select(({ val }) => [
          "UserID",
          val(year).as("HistoryYear"),
          val(leagueID.LeagueID).as("LeagueID"),
          val("Survivor").as("HistoryType"),
          val(null).as("HistoryWeek"),
          "Rank",
          val(new Date()).as("HistoryAdded"),
          val(ADMIN_USER).as("HistoryAddedBy"),
          val(new Date()).as("HistoryUpdated"),
          val(ADMIN_USER).as("HistoryUpdatedBy"),
        ])
        .where("Rank", "<", 3),
    )
    .executeTakeFirstOrThrow();
};
