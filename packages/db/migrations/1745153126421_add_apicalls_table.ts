import { type Kysely } from 'kysely';

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
	await db.schema.createTable("ApiCalls")
		.addColumn("ApiCallID", "integer", col => col.autoIncrement().primaryKey())
		.addColumn("ApiCallDate", "timestamp", col => col.notNull())
		.addColumn("ApiCallError", "text")
		.addColumn("ApiCallResponse", "json")
		.addColumn("ApiCallUrl", "varchar(255)", col => col.notNull())
		.addColumn("ApiCallWeek", "integer")
		.addColumn("ApiCallYear", "integer", col => col.notNull())
		.execute();
}

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("ApiCalls").execute();
}
