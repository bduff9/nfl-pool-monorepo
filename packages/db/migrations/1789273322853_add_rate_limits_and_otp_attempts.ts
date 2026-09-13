import { type Kysely, sql } from "kysely";

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("VerificationRequests")
    .addColumn("VerificationRequestAttempts", "integer", (col) => col.notNull().defaultTo(0))
    .execute();

  await db.schema
    .createTable("RateLimits")
    .addColumn("RateLimitID", "integer", (col) => col.autoIncrement().notNull().primaryKey())
    .addColumn("RateLimitKey", "varchar(255)", (col) => col.notNull())
    .addColumn("RateLimitAttempts", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("RateLimitWindowStart", "timestamp(6)", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP(6)`))
    .addColumn("RateLimitAdded", "timestamp", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn("RateLimitAddedBy", "varchar(50)", (col) => col.notNull())
    .addColumn("RateLimitUpdated", "timestamp", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn("RateLimitUpdatedBy", "varchar(50)", (col) => col.notNull())
    .addUniqueConstraint("RateLimits_RateLimitKey_unique", ["RateLimitKey"])
    .execute();
}

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("RateLimits").execute();
  await db.schema.alterTable("VerificationRequests").dropColumn("VerificationRequestAttempts").execute();
}
