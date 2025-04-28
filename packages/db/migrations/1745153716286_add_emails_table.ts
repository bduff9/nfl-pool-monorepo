import { type Kysely, sql } from 'kysely';

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
	await db.schema.createTable("Emails")
		.addColumn("EmailID", "varbinary(16)", col => col.defaultTo(sql`(RANDOM_BYTES(16))`).notNull().primaryKey())
		.addColumn("EmailType", "varchar(99)", col => col.notNull())
		.addColumn("EmailTo", "text", col => col.notNull())
		.addColumn("EmailSubject", "varchar(255)")
		.addColumn("EmailHtml", "text")
		.addColumn("EmailTextOnly", "text")
		.addColumn("EmailSms", "text")
		.addColumn("EmailCreatedAt", "timestamp", col => col.notNull())
		.addColumn("EmailUpdatedAt", "timestamp")
		.execute();
}

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("Emails").execute();
}
