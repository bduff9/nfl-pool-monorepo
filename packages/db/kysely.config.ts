import { defineConfig } from "kysely-ctl";
import { db } from "./src/kysely";

export default defineConfig({
  kysely: db,
  migrations: {
    allowJS: false,
  },
  seeds: { // optional.
    allowJS: false,
  }
});
