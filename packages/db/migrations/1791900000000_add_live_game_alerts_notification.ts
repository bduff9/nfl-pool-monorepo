import { type Kysely, sql } from "kysely";

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  await db
    .insertInto("NotificationTypes")
    .values({
      NotificationType: "LiveGameAlerts",
      NotificationTypeAddedBy: "Admin",
      NotificationTypeDescription: "Live Game Alerts",
      NotificationTypeHasEmail: 0,
      NotificationTypeHasHours: 0,
      NotificationTypeHasPushNotification: 1,
      NotificationTypeHasSMS: 0,
      NotificationTypeTooltip:
        "Push alerts during games: your survivor team falls behind or wins/loses, lead changes on your top picks, games you picked right ending, and moves into or out of the top 2 this week.",
      NotificationTypeUpdatedBy: "Admin",
    })
    .execute();

  // Backfill a preference row for every registered user, on by default. A push only reaches people who have enabled
  // push notifications in a browser, so this changes nothing for anyone without a subscription.
  await sql`
    INSERT INTO Notifications (UserID, NotificationType, NotificationEmail, NotificationSMS, NotificationPushNotification, NotificationAddedBy, NotificationUpdatedBy)
    SELECT u.UserID, 'LiveGameAlerts', 0, 0, 1,
      'Admin', 'Admin'
    FROM Users u
    WHERE u.UserDoneRegistering = 1
      AND u.UserDeleted IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM Notifications n WHERE n.UserID = u.UserID AND n.NotificationType = 'LiveGameAlerts'
      )`.execute(db);
}

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  await sql`DELETE FROM Notifications WHERE NotificationType = 'LiveGameAlerts'`.execute(db);

  await sql`DELETE FROM NotificationTypes WHERE NotificationType = 'LiveGameAlerts'`.execute(db);
}
