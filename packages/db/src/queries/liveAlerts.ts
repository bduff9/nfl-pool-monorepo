import { db } from "../kysely";

const MS_PER_MINUTE = 60_000;
const GAME_WINDOW_MINUTES = 6 * 60;
const RECENTLY_FINAL_MINUTES = 30;

/**
 * Games that kicked off within the last few hours and are either still unfinished or were only just finalized,
 * with both teams. An empty result means there is nothing live worth polling ESPN for.
 */
export const getLiveAlertGames = (now: Date) =>
  db
    .selectFrom("Games as g")
    .innerJoin("Teams as ht", "ht.TeamID", "g.HomeTeamID")
    .innerJoin("Teams as vt", "vt.TeamID", "g.VisitorTeamID")
    .select([
      "g.GameID",
      "g.GameWeek",
      "g.HomeTeamID",
      "g.VisitorTeamID",
      "ht.TeamName as HomeTeamName",
      "ht.TeamShortName as HomeTeamShortName",
      "vt.TeamName as VisitorTeamName",
      "vt.TeamShortName as VisitorTeamShortName",
    ])
    .where("g.GameKickoff", "<=", now)
    .where("g.GameKickoff", ">=", new Date(now.getTime() - GAME_WINDOW_MINUTES * MS_PER_MINUTE))
    .where((eb) =>
      eb.or([
        eb("g.GameStatus", "!=", "Final"),
        eb("g.GameUpdated", ">=", new Date(now.getTime() - RECENTLY_FINAL_MINUTES * MS_PER_MINUTE)),
      ]),
    )
    .execute();

/** Every game of the week with its official state, for projecting standings. */
export const getWeekProjectionGames = (week: number) =>
  db
    .selectFrom("Games")
    .select([
      "GameID",
      "GameStatus",
      "GameHomeScore",
      "GameVisitorScore",
      "HomeTeamID",
      "VisitorTeamID",
      "WinnerTeamID",
    ])
    .where("GameWeek", "=", week)
    .execute();

/** Every registered user's picks for the week. */
export const getWeekProjectionPicks = (week: number) =>
  db
    .selectFrom("Picks as p")
    .innerJoin("Games as g", "g.GameID", "p.GameID")
    .innerJoin("Users as u", "u.UserID", "p.UserID")
    .select(["p.GameID", "p.PickPoints", "p.TeamID", "p.UserID"])
    .where("g.GameWeek", "=", week)
    .where("u.UserDoneRegistering", "=", 1)
    .where("u.UserDeleted", "is", null)
    .execute();

/** This week's survivor picks of users who are still alive in the survivor pool. */
export const getAliveSurvivorPicks = (week: number) =>
  db
    .selectFrom("SurvivorPicks as sp")
    .innerJoin("SurvivorMV as smv", "smv.UserID", "sp.UserID")
    .select(["sp.TeamID", "sp.UserID"])
    .where("sp.SurvivorPickWeek", "=", week)
    .where("sp.SurvivorPickDeleted", "is", null)
    .where("sp.TeamID", "is not", null)
    .where("smv.IsAliveOverall", "=", 1)
    .execute();

/** Users who have live game alerts on and a device to send them to. */
export const getLiveAlertSubscriberIds = async (): Promise<number[]> => {
  const rows = await db
    .selectFrom("Notifications as n")
    .innerJoin("Users as u", "u.UserID", "n.UserID")
    .select("u.UserID")
    .where("n.NotificationType", "=", "LiveGameAlerts")
    .where("n.NotificationPushNotification", "=", 1)
    .where("u.UserCommunicationsOptedOut", "=", 0)
    .where("u.UserDoneRegistering", "=", 1)
    .where("u.UserDeleted", "is", null)
    .where((eb) => eb.exists(eb.selectFrom("Devices as d").select("d.DeviceID").whereRef("d.UserID", "=", "u.UserID")))
    .execute();

  return rows.map((row) => row.UserID);
};
