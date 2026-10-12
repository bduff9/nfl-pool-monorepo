import { type Kysely, sql } from "kysely";

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("Passkeys")
    .addColumn("PasskeyID", "integer", (col) => col.autoIncrement().notNull().primaryKey())
    .addColumn("UserID", "integer", (col) => col.notNull().references("Users.UserID").onDelete("cascade"))
    // base64url-encoded WebAuthn credential ID and COSE public key
    .addColumn("PasskeyCredentialID", "varchar(512)", (col) => col.notNull())
    .addColumn("PasskeyPublicKey", "text", (col) => col.notNull())
    .addColumn("PasskeyCounter", "bigint", (col) => col.notNull().defaultTo(0))
    // comma-separated AuthenticatorTransport values
    .addColumn("PasskeyTransports", "varchar(255)")
    .addColumn("PasskeyDeviceType", "varchar(32)", (col) => col.notNull())
    .addColumn("PasskeyBackedUp", sql`tinyint`, (col) => col.notNull().defaultTo(0))
    .addColumn("PasskeyName", "varchar(100)")
    .addColumn("PasskeyLastUsed", "timestamp")
    .addColumn("PasskeyAdded", "timestamp", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn("PasskeyAddedBy", "varchar(50)", (col) => col.notNull())
    .addColumn("PasskeyUpdated", "timestamp", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn("PasskeyUpdatedBy", "varchar(50)", (col) => col.notNull())
    .addUniqueConstraint("Passkeys_PasskeyCredentialID_unique", ["PasskeyCredentialID"])
    .execute();

  await db.schema.createIndex("Passkeys_UserID_idx").on("Passkeys").column("UserID").execute();
}

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("Passkeys").execute();
}
