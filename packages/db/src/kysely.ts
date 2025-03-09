import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";

import type { DB } from ".";

export const db = new Kysely<DB>({
  dialect: new MysqlDialect({
    pool: createPool({
      uri: process.env.DATABASE_URL,
      connectionLimit: 10,
      timezone: "Z",
    }),
  }),
  log: (event) => {
    if (event.level === "error") {
      console.error("Kysely error:", event);
    } else {
      // biome-ignore lint/suspicious/noConsoleLog: server logging for Kysely
      console.log("Kysely log:", {
        sql: event.query.sql,
        parms: event.query.parameters,
        duration: event.queryDurationMillis,
      });
    }
  },
});
