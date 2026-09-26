import { type Kysely, sql } from "kysely";

const NEW_NOTIFICATION_TYPES = ["GameTimeChanged", "SurvivorEliminated"];

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  await db
    .insertInto("NotificationTypes")
    .values([
      {
        NotificationType: "GameTimeChanged",
        NotificationTypeDescription: "Game Time Changes",
        NotificationTypeHasEmail: 1,
        NotificationTypeHasSMS: 1,
        NotificationTypeHasPushNotification: 1,
        NotificationTypeHasHours: 0,
        NotificationTypeTooltip:
          "Get notified when the kickoff time changes for a game you have picks for. Sent at most once per changed game.",
        NotificationTypeAddedBy: "Admin",
        NotificationTypeUpdatedBy: "Admin",
      },
      {
        NotificationType: "SurvivorEliminated",
        NotificationTypeDescription: "Survivor Eliminated",
        NotificationTypeHasEmail: 1,
        NotificationTypeHasSMS: 1,
        NotificationTypeHasPushNotification: 1,
        NotificationTypeHasHours: 0,
        NotificationTypeTooltip:
          "Get notified as soon as you are eliminated from the survivor pool, either by a losing pick or a missed week.",
        NotificationTypeAddedBy: "Admin",
        NotificationTypeUpdatedBy: "Admin",
      },
    ])
    .execute();

  // Backfill preference rows for existing users: email on, SMS/push off. New users get rows
  // for every NotificationType when they save their profile (updateUserNotifications), but
  // those default all channels off, so without this backfill nobody would be reachable.
  await sql`
    INSERT INTO Notifications (UserID, NotificationType, NotificationEmail, NotificationSMS, NotificationPushNotification, NotificationAddedBy, NotificationUpdatedBy)
    SELECT u.UserID, nt.NotificationType, 1, 0, 0, 'Admin', 'Admin'
    FROM Users u
    CROSS JOIN NotificationTypes nt
    WHERE u.UserDoneRegistering = 1
      AND u.UserDeleted IS NULL
      AND nt.NotificationType IN ('GameTimeChanged', 'SurvivorEliminated')
      AND NOT EXISTS (
        SELECT 1 FROM Notifications n WHERE n.UserID = u.UserID AND n.NotificationType = nt.NotificationType
      )`.execute(db);

  await db.schema.createIndex("idx_GameWeek").on("Games").column("GameWeek").execute();
  await db.schema.createIndex("idx_GameKickoff").on("Games").column("GameKickoff").execute();
}

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex("idx_GameKickoff").on("Games").execute();
  await db.schema.dropIndex("idx_GameWeek").on("Games").execute();

  await sql`DELETE FROM Notifications WHERE NotificationType IN ('GameTimeChanged', 'SurvivorEliminated')`.execute(db);

  await sql`DELETE FROM NotificationTypes WHERE NotificationType IN ('GameTimeChanged', 'SurvivorEliminated')`.execute(db);
}
