import { createEnv } from "@t3-oss/env-nextjs";
import { type } from "arktype";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_ENV: type("string"),
    NEXT_PUBLIC_LOGROCKET_PROJ: type("string"),
    NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN: type("string"),
    NEXT_PUBLIC_SENTRY_DSN: type("string.url"),
    NEXT_PUBLIC_SITE_URL: type("string.url"),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
    NEXT_PUBLIC_LOGROCKET_PROJ: process.env.NEXT_PUBLIC_LOGROCKET_PROJ,
    NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN: process.env.NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  server: {
    AWS_AK_ID: type("string"),
    AWS_R: type("'us-east-2'"),
    AWS_SAK_ID: type("string"),
    BACKUP_BUCKET_NAME: type("string"),
    DATABASE_URL: type("string.url"),
    domain: type("string.url"),
    EMAIL_FROM: type("string"),
    GOOGLE_ID: type("string"),
    GOOGLE_SECRET: type("string"),
    LOGFLARE_API_KEY: type("string"),
    LOGFLARE_SOURCE_TOKEN: type("string"),
    LOGTAIL_SOURCE_TOKEN: type("string"),
    SENTRY_AUTH_TOKEN: type("string"),
    SENTRY_SERVER_INIT_PATH: type("string"),
    TWILIO_ACCOUNT_SID: type("string.alphanumeric"),
    TWILIO_AUTH_TOKEN: type("string.alphanumeric"),
    TWILIO_PHONE_NUMBER: type("string"),
  },
});
