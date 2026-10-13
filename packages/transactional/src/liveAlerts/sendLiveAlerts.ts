import { createHash } from "node:crypto";

import { db } from "@nfl-pool-monorepo/db/src/kysely";

import { sendPushNotification } from "../../pushNotifications";
import type { LiveAlert } from "./types";

const SEND_CONCURRENCY = 10;
const UUID_LAYOUT = [8, 4, 4, 4, 12] as const;
const MYSQL_DUPLICATE_ENTRY = "ER_DUP_ENTRY";

export type SendResult = { failed: number; sent: number; skipped: number };

/**
 * A stable 36-character id for an alert, shaped like a UUID so it fits Emails.EmailID. The same alert type, key
 * and user always produce the same id, which is what lets the Emails table act as the "already sent" ledger.
 */
export const getAlertId = (alert: Pick<LiveAlert, "key" | "type" | "userId">): string => {
  const hex = createHash("sha256").update(`liveGameAlert|${alert.type}|${alert.key}|${alert.userId}`).digest("hex");
  let offset = 0;

  return UUID_LAYOUT.map((length) => {
    const part = hex.slice(offset, offset + length);

    offset += length;

    return part;
  }).join("-");
};

const isDuplicateEntry = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === MYSQL_DUPLICATE_ENTRY;

/**
 * Records the alert in the Emails log before it is sent. Returns false when the alert was already recorded, in
 * which case it must not be sent again; any other database error is thrown so the alert is retried next run.
 */
const claimAlert = async (alert: LiveAlert): Promise<boolean> => {
  try {
    await db
      .insertInto("Emails")
      .values({
        EmailCreatedAt: new Date(),
        EmailID: getAlertId(alert),
        EmailTo: String(alert.userId),
        EmailType: "liveGameAlert",
      })
      .executeTakeFirstOrThrow();

    return true;
  } catch (error) {
    if (isDuplicateEntry(error)) {
      return false;
    }

    throw error;
  }
};

const sendOne = async (alert: LiveAlert): Promise<keyof SendResult> => {
  try {
    if (!(await claimAlert(alert))) {
      return "skipped";
    }

    await sendPushNotification(alert.userId, alert.title, alert.body, "liveGameAlert", alert.path);

    return "sent";
  } catch (error) {
    console.error("Failed to send live game alert", { alert, error });

    return "failed";
  }
};

/** Sends each alert at most once, no matter how many runs see it, and reports how many were sent or skipped. */
export const sendLiveAlerts = async (alerts: LiveAlert[]): Promise<SendResult> => {
  const result: SendResult = { failed: 0, sent: 0, skipped: 0 };

  for (let start = 0; start < alerts.length; start += SEND_CONCURRENCY) {
    // Bounded batches keep a burst of alerts from flooding the push services
    const outcomes = await Promise.all(alerts.slice(start, start + SEND_CONCURRENCY).map(sendOne));

    for (const outcome of outcomes) {
      result[outcome] += 1;
    }
  }

  return result;
};
