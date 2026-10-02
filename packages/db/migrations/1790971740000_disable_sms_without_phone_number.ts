import { type Kysely, sql } from "kysely";

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  // editMyProfile never persisted UserPhone, so users could enable SMS with a number that was
  // silently dropped. SMS can't be delivered without a phone, so turn it off for those users.
  await sql`
    UPDATE Notifications n
    INNER JOIN Users u ON u.UserID = n.UserID
    SET n.NotificationSMS = 0,
      n.NotificationSMSHoursBefore = NULL,
      n.NotificationUpdatedBy = 'Admin'
    WHERE n.NotificationSMS = 1
      AND (u.UserPhone IS NULL OR u.UserPhone = '')`.execute(db);
}

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(_db: Kysely<any>): Promise<void> {
  // Data backfill: the previous SMS settings were not recorded and can't be restored.
}
