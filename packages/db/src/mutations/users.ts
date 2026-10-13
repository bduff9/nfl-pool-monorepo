import { ADMIN_USER, DEFAULT_AUTO_PICKS } from "@nfl-pool-monorepo/utils/constants";
import type { Selectable, Transaction } from "kysely";

import type { DB, Users } from "../index";
import { db } from "../kysely";
import { getPublicLeague } from "../queries/league";
import { getSurvivorCost, getSystemYear } from "../queries/systemValue";
import { getCurrentWeek } from "../queries/week";
import { upcomingSeasonOpenerQuery } from "./userHelpers";

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
  const [publicLeague, week] = await Promise.all([getPublicLeague(), getCurrentWeek()]);

  if (week > 1) {
    const lowest = await trx.selectFrom("OverallMV").select("UserID").orderBy("Rank", "desc").executeTakeFirstOrThrow();
    const teamName = user.UserTeamName || "No team name";
    const userName = user.UserName || user.UserEmail;

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
            eb.val(teamName).as("TeamName"),
            eb.val(userName).as("UserName"),
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
            eb.val(teamName).as("TeamName"),
            eb.val(userName).as("UserName"),
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
  const result = await upcomingSeasonOpenerQuery(trx).execute();

  if (result.length === 0) throw new Error("Season has already started!");

  const { UserEmail } = await trx
    .selectFrom("Users")
    .select("UserEmail")
    .where("UserID", "=", userId)
    .executeTakeFirstOrThrow();
  const leagues = await trx.selectFrom("UserLeagues").select("LeagueID").where("UserID", "=", userId).execute();

  for (const league of leagues) {
    // react-doctor-disable-next-line async-await-in-loop -- these inserts share one transaction connection (trx); mysql2 processes queries on a connection sequentially, so Promise.all here would not run them concurrently
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
    .set({ UserDoneRegistering: 0, UserUpdated: new Date(), UserUpdatedBy: ADMIN_USER })
    .where("UserID", "=", userId)
    .executeTakeFirstOrThrow();
};

// Removes a user from this season's pool: their entries, standings rows, unpaid fees and history record. The Users row,
// Notifications, Devices, Sessions and Passkeys stay so they can re-register like a late signup.
export const removeUserFromSeason = async (trx: Transaction<DB>, userId: number, adminEmail: string): Promise<void> => {
  const year = await getSystemYear();

  await trx.deleteFrom("Picks").where("UserID", "=", userId).execute();
  await trx.deleteFrom("Tiebreakers").where("UserID", "=", userId).execute();
  await trx.deleteFrom("SurvivorPicks").where("UserID", "=", userId).execute();
  await trx.deleteFrom("WeeklyMV").where("UserID", "=", userId).execute();
  await trx.deleteFrom("OverallMV").where("UserID", "=", userId).execute();
  await trx.deleteFrom("SurvivorMV").where("UserID", "=", userId).execute();
  await trx.deleteFrom("Payments").where("UserID", "=", userId).where("PaymentType", "=", "Fee").execute();
  await trx.deleteFrom("UserHistory").where("UserID", "=", userId).where("UserHistoryYear", "=", year).execute();
  await trx
    .updateTable("Users")
    .set({
      UserAutoPicksLeft: DEFAULT_AUTO_PICKS,
      UserDoneRegistering: 0,
      UserPlaysSurvivor: 0,
      UserUpdated: new Date(),
      UserUpdatedBy: adminEmail,
    })
    .where("UserID", "=", userId)
    .executeTakeFirstOrThrow();
};

export const unregisterUserForSurvivor = async (
  trx: Transaction<DB>,
  userId: number,
  updatedBy?: string,
  override = false,
) => {
  const result = await upcomingSeasonOpenerQuery(trx).execute();

  if (result.length === 0 && !override) throw new Error("Season has already started!");

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
