import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { sql } from "kysely";
import { headers } from "next/headers";
import "server-only";

const RATE_LIMIT_AUDIT_USER = "RATE_LIMIT";
const CLEANUP_THRESHOLD_MS = 24 * 60 * 60 * 1000;

type RateLimitOptions = {
  /** Stable identifier for what is being limited, e.g. "login:ip:1.2.3.4". */
  key: string;
  /** Maximum attempts allowed within the window. */
  limit: number;
  /** Fixed window size in milliseconds. */
  windowMs: number;
};

/**
 * DB-backed fixed-window rate limiter that works across server instances.
 * Records the attempt and returns false when `key` has exceeded `limit` within
 * the current window.
 */
export const checkRateLimit = async ({ key, limit, windowMs }: RateLimitOptions): Promise<boolean> => {
  // Unit tests run outside request scope with no IP, and would otherwise share rate
  // limit state across assertions, so they bypass the limiter entirely.
  if (process.env.NODE_ENV === "test") {
    return true;
  }

  const now = new Date();
  const newWindowStart = new Date(now.getTime() - windowMs);

  await db
    .insertInto("RateLimits")
    .values({
      RateLimitAddedBy: RATE_LIMIT_AUDIT_USER,
      RateLimitAttempts: 1,
      RateLimitKey: key,
      RateLimitUpdatedBy: RATE_LIMIT_AUDIT_USER,
      RateLimitWindowStart: now,
    })
    .onDuplicateKeyUpdate({
      RateLimitAttempts: sql`IF(RateLimits.RateLimitWindowStart < ${newWindowStart}, 1, RateLimits.RateLimitAttempts + 1)`,
      RateLimitUpdatedBy: RATE_LIMIT_AUDIT_USER,
      RateLimitWindowStart: sql`IF(RateLimits.RateLimitWindowStart < ${newWindowStart}, ${now}, RateLimits.RateLimitWindowStart)`,
    })
    .execute();

  // Opportunistic cleanup so the table doesn't accumulate abandoned keys.
  await db
    .deleteFrom("RateLimits")
    .where("RateLimitWindowStart", "<", new Date(now.getTime() - CLEANUP_THRESHOLD_MS))
    .execute();

  const row = await db
    .selectFrom("RateLimits")
    .select("RateLimitAttempts")
    .where("RateLimitKey", "=", key)
    .executeTakeFirstOrThrow();

  return row.RateLimitAttempts <= limit;
};

/** Best-effort client IP extraction; falls back to "unknown" when absent or unavailable. */
export const getClientIp = async (): Promise<string> => {
  try {
    const forwarded = (await headers()).get("x-forwarded-for");

    return forwarded?.split(",")[0]?.trim() || "unknown";
  } catch {
    // Called outside a request scope (e.g. unit tests).
    return "unknown";
  }
};
