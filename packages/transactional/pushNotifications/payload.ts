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

import { env } from "../src/env";

export type PushAction = { action: string; title: string; url: string };

// Declarative Web Push (https://webkit.org/blog/16535/meet-declarative-web-push/): Safari 18.4+ shows `notification`
// itself, without running the service worker. Other browsers deliver the same JSON to the worker's push event, which
// also reads the extra top-level `actions`.
const DECLARATIVE_WEB_PUSH = 8030;

export const buildPushPayload = (
  title: string,
  body: string,
  path: string,
  badge?: number,
  actions?: Array<PushAction>,
): string =>
  JSON.stringify({
    ...(actions ? { actions } : {}),
    mutable: true,
    notification: {
      ...(badge === undefined ? {} : { app_badge: badge }),
      body,
      lang: "en",
      navigate: new URL(path, env.domain).href,
      title,
    },
    web_push: DECLARATIVE_WEB_PUSH,
  });
