import { type Kysely, sql } from "kysely";

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("APICalls").ifExists().execute();
}

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("APICalls")
    .addColumn("APICallID", "integer", (col) => col.autoIncrement().notNull().primaryKey())
    .addColumn("APICallDate", "timestamp", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn("APICallError", "varchar(250)")
    .addColumn("APICallResponse", "text")
    .addColumn("APICallURL", "varchar(250)", (col) => col.notNull())
    .addColumn("APICallWeek", "integer")
    .addColumn("APICallYear", "integer", (col) => col.notNull())
    .addColumn("APICallAdded", "timestamp", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn("APICallAddedBy", "varchar(50)", (col) => col.notNull())
    .addColumn("APICallUpdated", "timestamp", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn("APICallUpdatedBy", "varchar(50)", (col) => col.notNull())
    .addColumn("APICallDeleted", "timestamp")
    .addColumn("APICallDeletedBy", "varchar(50)")
    .addUniqueConstraint("uk_APICall", ["APICallDate"])
    .execute();
}
