/*******************************************************************************
 * NFL Confidence Pool BE - the backend implementation of an NFL confidence pool.
 * Copyright (C) 2015-present Brian Duffey
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see {http://www.gnu.org/licenses/}.
 * Home: https://asitewithnoname.com/
 */

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import webpush from "web-push";

import type { EmailTypes } from "../emails/types";

webpush.setVapidDetails(
  "mailto:info@asitewithnoname.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
  process.env.VAPID_PRIVATE_KEY ?? "",
);

export const sendPushNotification = async (
  userId: number,
  title: string,
  body: string,
  type: (typeof EmailTypes)[number],
): Promise<void> => {
  try {
    const subscriptions = await db.selectFrom("Devices").select("DeviceSub").where("UserID", "=", userId).execute();

    for (const subscription of subscriptions) {
      await webpush.sendNotification(
        JSON.parse(subscription.DeviceSub) as webpush.PushSubscription,
        JSON.stringify({
          body,
          title,
        }),
      );
    }
  } catch (error) {
    console.error("Error sending push notification:", { body, error, title, type, userId });
  }
};
