import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";

import type { DB } from ".";

export const db = new Kysely<DB>({
  dialect: new MysqlDialect({
    pool: createPool({
      connectionLimit: process.env.NODE_ENV === "production" ? 5 : 10,
      // Keep warm-container connections healthy across idle periods (NAT gateways and
      // firewalls drop idle sockets, which surfaces as ECONNRESET on the next query).
      enableKeepAlive: true,
      maxIdle: 5,
      timezone: "Z",
      uri: process.env.DATABASE_URL ?? "",
    }),
  }),
  log: (event) => {
    if (event.level === "error") {
      console.error("Kysely error:", event);
    } else if (process.env.LOG_QUERIES === "true") {
      // Query logging includes bound parameters (emails, phone numbers), so it stays
      // opt-in for production rather than flooding CloudWatch with PII.
      console.log("Kysely log:", {
        duration: event.queryDurationMillis,
        parameters: event.query.parameters,
        sql: event.query.sql,
      });
    }
  },
});
