import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";

import type { DB } from ".";

export const db = new Kysely<DB>({
  dialect: new MysqlDialect({
    pool: createPool({
      connectionLimit: 10,
      timezone: "Z",
      uri: process.env.DATABASE_URL ?? "",
    }),
  }),
  log: (event) => {
    if (event.level === "error") {
      console.error("Kysely error:", event);
    } else {
      console.log("Kysely log:", {
        duration: event.queryDurationMillis,
        parms: event.query.parameters,
        sql: event.query.sql,
      });
    }
  },
});
