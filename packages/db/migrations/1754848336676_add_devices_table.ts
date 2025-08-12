import { type Kysely, sql } from "kysely";

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("Devices")
    .addColumn("DeviceID", "integer", (col) => col.autoIncrement().notNull().primaryKey())
    .addColumn("DeviceType", "varchar(255)", (col) => col.notNull())
    .addColumn("DeviceSub", "text", (col) => col.notNull())
    .addColumn("UserID", "integer", (col) => col.notNull().references("Users.UserID").onDelete("cascade"))
    .addColumn("DeviceAdded", "timestamp", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn("DeviceAddedBy", "varchar(50)", (col) => col.notNull())
    .addColumn("DeviceUpdated", "timestamp", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn("DeviceUpdatedBy", "varchar(50)", (col) => col.notNull())
    .addColumn("DeviceDeleted", "timestamp")
    .addColumn("DeviceDeletedBy", "varchar(50)")
    .execute();
}

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("Devices").execute();
}
