import { createEnv } from "@t3-oss/env-nextjs";
import { type } from "arktype";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_ENV: type("string"),
    NEXT_PUBLIC_LOGROCKET_PROJ: type("string"),
    // react-doctor-disable-next-line public-env-secret-name -- Logtail's source token is a write-only client-side ingestion id, meant to be public
    NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN: type("string"),
    NEXT_PUBLIC_SENTRY_DSN: type("string.url"),
    NEXT_PUBLIC_SITE_URL: type("string.url"),
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: type("string"),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
    NEXT_PUBLIC_LOGROCKET_PROJ: process.env.NEXT_PUBLIC_LOGROCKET_PROJ,
    NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN: process.env.NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  },
});
