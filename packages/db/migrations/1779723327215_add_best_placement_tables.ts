import { type Kysely, sql } from "kysely";

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("BestPlacementWeekly")
    .addColumn("BestPlacementWeeklyID", "integer", (col) => col.autoIncrement().notNull().primaryKey())
    .addColumn("Week", "integer", (col) => col.notNull())
    .addColumn("UserID", "integer", (col) => col.notNull().references("Users.UserID").onDelete("cascade"))
    .addColumn("BestRank", "integer")
    .addColumn("CanAchieveFirst", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("CanAchieveSecond", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("UndecidedGamesAtCalc", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("ScenarioCount", "bigint", (col) => col.notNull().defaultTo(0))
    .addColumn("LastUpdated", "timestamp", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addUniqueConstraint("BestPlacementWeekly_Week_UserID_unique", ["Week", "UserID"])
    .execute();

  await db.schema
    .createIndex("BestPlacementWeekly_Week_idx")
    .on("BestPlacementWeekly")
    .column("Week")
    .execute();

  await db.schema
    .createTable("BestPlacementOverall")
    .addColumn("BestPlacementOverallID", "integer", (col) => col.autoIncrement().notNull().primaryKey())
    .addColumn("UserID", "integer", (col) => col.notNull().references("Users.UserID").onDelete("cascade"))
    .addColumn("BestRank", "integer")
    .addColumn("CanAchieveFirst", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("CanAchieveSecond", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("CanAchieveThird", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("UndecidedGamesAtCalc", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("ScenarioCount", "bigint", (col) => col.notNull().defaultTo(0))
    .addColumn("LastUpdated", "timestamp", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addUniqueConstraint("BestPlacementOverall_UserID_unique", ["UserID"])
    .execute();
}

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("BestPlacementOverall").execute();
  await db.schema.dropTable("BestPlacementWeekly").execute();
}
