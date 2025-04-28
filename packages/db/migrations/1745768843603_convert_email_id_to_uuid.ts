import type { Kysely } from 'kysely';

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
	await db.schema.alterTable("Emails").modifyColumn("EmailID", 'varchar(36)').execute();
	await db.schema.alterTable("Emails").alterColumn("EmailID", eb => eb.dropDefault()).execute();
}

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.alterTable("Emails").modifyColumn("EmailID", 'varbinary(16)').execute();
	await db.schema.alterTable("Emails").alterColumn("EmailID", eb => eb.setDefault('(RANDOM_BYTES(16))')).execute();
}
