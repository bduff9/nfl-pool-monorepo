import type { DB, Users } from "@nfl-pool-monorepo/db/src";
import { ADMIN_USER, DEFAULT_AUTO_PICKS } from "@nfl-pool-monorepo/utils/constants";
import { type Selectable, sql, type Transaction } from "kysely";
import { ZSAError } from "zsa";

import { db } from "../kysely";
import { getPublicLeague } from "../queries/league";
import { getSurvivorCost } from "../queries/systemValue";
import { getCurrentWeek } from "../queries/week";

export const clearOldUserData = async (trx: Transaction<DB>): Promise<void> => {
  await trx
    .deleteFrom("Notifications")
    .where((eb) => eb("UserID", "in", eb.selectFrom("Users").select("UserID").where("UserDoneRegistering", "=", 0)))
    .executeTakeFirstOrThrow();
  await trx
    .updateTable("Users")
    .set({
      UserAutoPicksLeft: DEFAULT_AUTO_PICKS,
      UserDoneRegistering: 0,
      UserPlaysSurvivor: 0,
      UserUpdated: new Date(),
      UserUpdatedBy: ADMIN_USER,
    })
    .where("UserDoneRegistering", "=", 1)
    .executeTakeFirstOrThrow();
};

export const populateUserData = async (
  trx: Transaction<DB>,
  user: Pick<Selectable<Users>, "UserID" | "UserEmail" | "UserPlaysSurvivor" | "UserTeamName" | "UserName">,
): Promise<void> => {
  const publicLeague = await getPublicLeague();
  const week = await getCurrentWeek();

  if (week > 1) {
    const lowest = await trx.selectFrom("OverallMV").select("UserID").orderBy("Rank desc").executeTakeFirstOrThrow();

    // Populate picks
    const picksResult = await trx
      .insertInto("Picks")
      .columns(["UserID", "LeagueID", "GameID", "TeamID", "PickPoints", "PickAddedBy", "PickUpdatedBy"])
      .expression((eb) =>
        eb
          .selectFrom("Picks")
          .select((eb) => [
            eb.val(user.UserID).as("UserID"),
            eb.val(publicLeague.LeagueID).as("LeagueID"),
            "GameID",
            "TeamID",
            "PickPoints",
            eb.val(user.UserEmail).as("PickAddedBy"),
            eb.val(user.UserEmail).as("PickUpdatedBy"),
          ])
          .where("UserID", "=", lowest.UserID),
      )
      .executeTakeFirstOrThrow();

    console.debug(`Inserted lowest score picks for user ${user.UserID}`, picksResult);

    // Populate tiebreakers
    const tiebreakersResult = await trx
      .insertInto("Tiebreakers")
      .columns([
        "UserID",
        "LeagueID",
        "TiebreakerWeek",
        "TiebreakerLastScore",
        "TiebreakerHasSubmitted",
        "TiebreakerAddedBy",
        "TiebreakerUpdatedBy",
      ])
      .expression((eb) =>
        eb
          .selectFrom("Tiebreakers")
          .select([
            eb.val(user.UserID).as("UserID"),
            eb.val(publicLeague.LeagueID).as("LeagueID"),
            "TiebreakerWeek",
            "TiebreakerLastScore",
            "TiebreakerHasSubmitted",
            eb.val(user.UserEmail).as("TiebreakerAddedBy"),
            eb.val(user.UserEmail).as("TiebreakerUpdatedBy"),
          ])
          .where("UserID", "=", lowest.UserID),
      )
      .executeTakeFirstOrThrow();

    console.debug(`Inserted lowest score tiebreakers for user ${user.UserID}`, tiebreakersResult);

    // Populate WeeklyMV
    const weeklyMvResult = await trx
      .insertInto("WeeklyMV")
      .columns([
        "Week",
        "Rank",
        "Tied",
        "UserID",
        "TeamName",
        "UserName",
        "PointsEarned",
        "PointsWrong",
        "PointsPossible",
        "PointsTotal",
        "GamesCorrect",
        "GamesWrong",
        "GamesPossible",
        "GamesTotal",
        "GamesMissed",
        "TiebreakerScore",
        "LastScore",
        "TiebreakerIsUnder",
        "TiebreakerDiffAbsolute",
        "IsEliminated",
        "LastUpdated",
      ])
      .expression((eb) =>
        eb
          .selectFrom("WeeklyMV")
          .select([
            "Week",
            "Rank",
            eb.val(1).as("Tied"),
            eb.val(user.UserID).as("UserID"),
            eb.val(user.UserTeamName).as("TeamName"),
            eb.val(user.UserName).as("UserName"),
            "PointsEarned",
            "PointsWrong",
            "PointsPossible",
            "PointsTotal",
            "GamesCorrect",
            "GamesWrong",
            "GamesPossible",
            "GamesTotal",
            "GamesMissed",
            "TiebreakerScore",
            "LastScore",
            "TiebreakerIsUnder",
            "TiebreakerDiffAbsolute",
            "IsEliminated",
            "LastUpdated",
          ])
          .where("UserID", "=", lowest.UserID),
      )
      .executeTakeFirstOrThrow();

    console.debug(`Inserted lowest score WeeklyMV for user ${user.UserID}`, weeklyMvResult);

    // Populate OverallMV
    const overallMvResult = await trx
      .insertInto("OverallMV")
      .columns([
        "Rank",
        "Tied",
        "UserID",
        "TeamName",
        "UserName",
        "PointsEarned",
        "PointsWrong",
        "PointsPossible",
        "PointsTotal",
        "GamesCorrect",
        "GamesWrong",
        "GamesPossible",
        "GamesTotal",
        "GamesMissed",
        "IsEliminated",
        "LastUpdated",
      ])
      .expression((eb) =>
        eb
          .selectFrom("OverallMV")
          .select([
            "Rank",
            eb.val(1).as("Tied"),
            eb.val(user.UserID).as("UserID"),
            eb.val(user.UserTeamName).as("TeamName"),
            eb.val(user.UserName).as("UserName"),
            "PointsEarned",
            "PointsWrong",
            "PointsPossible",
            "PointsTotal",
            "GamesCorrect",
            "GamesWrong",
            "GamesPossible",
            "GamesTotal",
            "GamesMissed",
            "IsEliminated",
            "LastUpdated",
          ])
          .where("UserID", "=", lowest.UserID),
      )
      .executeTakeFirstOrThrow();

    console.debug(`Inserted lowest score OverallMV for user ${user.UserID}`, overallMvResult);
  } else {
    // Populate picks
    const picksResult = await trx
      .insertInto("Picks")
      .columns(["UserID", "LeagueID", "GameID", "PickAddedBy", "PickUpdatedBy"])
      .expression((eb) =>
        eb
          .selectFrom("Games")
          .select([
            eb.val(user.UserID).as("UserID"),
            eb.val(publicLeague.LeagueID).as("LeagueID"),
            "GameID",
            eb.val(user.UserEmail).as("PickAddedBy"),
            eb.val(user.UserEmail).as("PickUpdatedBy"),
          ]),
      )
      .executeTakeFirstOrThrow();

    console.debug(`Inserted picks for user ${user.UserID}`, picksResult);

    // Populate tiebreakers
    const tiebreakersResult = await trx
      .insertInto("Tiebreakers")
      .columns([
        "UserID",
        "LeagueID",
        "TiebreakerWeek",
        "TiebreakerHasSubmitted",
        "TiebreakerAddedBy",
        "TiebreakerUpdatedBy",
      ])
      .expression((eb) =>
        eb
          .selectFrom("Games")
          .select([
            eb.val(user.UserID).as("UserID"),
            eb.val(publicLeague.LeagueID).as("LeagueID"),
            "GameWeek",
            eb.val(0).as("TiebreakerHasSubmitted"),
            eb.val(user.UserEmail).as("TiebreakerAddedBy"),
            eb.val(user.UserEmail).as("TiebreakerUpdatedBy"),
          ])
          .groupBy("GameWeek"),
      )
      .executeTakeFirstOrThrow();

    console.debug(`Inserted tiebreakers for user ${user.UserID}`, tiebreakersResult);
  }

  if (user.UserPlaysSurvivor === 1) {
    await registerUserForSurvivor(trx, user.UserID);
  }
};

export const registerUserForSurvivor = async (trx: Transaction<DB>, userId: number, updatedBy?: string) => {
  const result = await trx
    .selectFrom("Games")
    .select("GameID")
    .where("GameNumber", "=", 1)
    .where("GameWeek", "=", 1)
    .where("GameKickoff", ">", sql<Date>`CURRENT_TIMESTAMP`)
    .execute();

  if (result.length === 0) throw new ZSAError("PRECONDITION_FAILED", "Season has already started!");

  const { UserEmail } = await trx
    .selectFrom("Users")
    .select("UserEmail")
    .where("UserID", "=", userId)
    .executeTakeFirstOrThrow();
  const leagues = await trx.selectFrom("UserLeagues").select("LeagueID").where("UserID", "=", userId).execute();

  for (const league of leagues) {
    const result = await trx
      .insertInto("SurvivorPicks")
      .columns(["UserID", "LeagueID", "SurvivorPickWeek", "GameID", "SurvivorPickAddedBy", "SurvivorPickUpdatedBy"])
      .expression((eb) =>
        eb
          .selectFrom("Games")
          .select([
            eb.val(userId).as("UserID"),
            eb.val(league.LeagueID).as("LeagueID"),
            "GameWeek",
            "GameID",
            eb.val(updatedBy ?? UserEmail).as("SurvivorPickAddedBy"),
            eb.val(updatedBy ?? UserEmail).as("SurvivorPickUpdatedBy"),
          ])
          .where("GameNumber", "=", 1),
      )
      .executeTakeFirstOrThrow();

    console.log(`Inserted survivor picks for user ${userId} and league ${league.LeagueID}`, result);
  }

  await trx
    .updateTable("Users")
    .set({ UserPlaysSurvivor: 1, UserUpdatedBy: updatedBy ?? UserEmail })
    .where("UserID", "=", userId)
    .executeTakeFirstOrThrow();

  const survivorCost = await getSurvivorCost();

  await trx
    .insertInto("Payments")
    .values({
      PaymentAddedBy: updatedBy ?? UserEmail,
      PaymentAmount: -1 * survivorCost,
      PaymentDescription: "Survivor Pool Entry Fee",
      PaymentType: "Fee",
      PaymentUpdatedBy: updatedBy ?? UserEmail,
      PaymentWeek: null,
      UserID: userId,
    })
    .executeTakeFirstOrThrow();
};

export const unregisterUser = async (userId: number): Promise<void> => {
  await db
    .updateTable("Users")
    .set({ UserDoneRegistering: 0, UserUpdated: new Date(), UserUpdatedBy: "ADMIN" })
    .where("UserID", "=", userId)
    .executeTakeFirstOrThrow();
};

export const unregisterUserForSurvivor = async (
  trx: Transaction<DB>,
  userId: number,
  updatedBy?: string,
  override = false,
) => {
  const result = await trx
    .selectFrom("Games")
    .select("GameID")
    .where("GameNumber", "=", 1)
    .where("GameWeek", "=", 1)
    .where("GameKickoff", ">", sql<Date>`CURRENT_TIMESTAMP`)
    .execute();

  if (result.length === 0 && !override) throw new ZSAError("PRECONDITION_FAILED", "Season has already started!");

  const { UserEmail } = await trx
    .selectFrom("Users")
    .select("UserEmail")
    .where("UserID", "=", userId)
    .executeTakeFirstOrThrow();

  await trx.deleteFrom("SurvivorPicks").where("UserID", "=", userId).executeTakeFirstOrThrow();
  await trx
    .updateTable("Users")
    .set({ UserPlaysSurvivor: 0, UserUpdatedBy: updatedBy ?? UserEmail })
    .where("UserID", "=", userId)
    .executeTakeFirstOrThrow();
  await trx
    .deleteFrom("Payments")
    .where("UserID", "=", userId)
    .where("PaymentDescription", "=", "Survivor Pool Entry Fee")
    .executeTakeFirstOrThrow();
};
