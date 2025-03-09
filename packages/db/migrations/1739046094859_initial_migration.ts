import { type Kysely, sql } from "kysely";

// biome-ignore lint/suspicious/noExplicitAny: Kysely migrations require any
export async function up(db: Kysely<any>): Promise<void> {
  // up migration code goes here...
  // note: up migrations are mandatory. you must implement this function.
  // For more info, see: https://kysely.dev/docs/migrations
  await sql`SELECT 1`.execute(db);
}

// biome-ignore lint/suspicious/noExplicitAny: Kysely migrations require any
export async function down(db: Kysely<any>): Promise<void> {
  // down migration code goes here...
  // note: down migrations are optional. you can safely delete this function.
  // For more info, see: https://kysely.dev/docs/migrations
}
