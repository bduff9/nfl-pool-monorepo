/*******************************************************************************
 * NFL Confidence Pool FE - the frontend implementation of an NFL confidence pool.
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

import { verifyEmailLink } from "@nfl-pool-monorepo/transactional/src/emailToken";
import type { NextRequest } from "next/server";

import { htmlResponse, parseUnsubscribeForm } from "@/lib/unsubscribe";
import { unsubscribe } from "@/server/actions/email";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const GET = async (req: NextRequest, _ctx: RouteContext<"/api/email/unsubscribe">): Promise<Response> => {
  const { nextUrl } = req;
  const { searchParams } = nextUrl;
  const email = escapeHtml(searchParams.get("email") ?? "");
  const token = escapeHtml(searchParams.get("t") ?? "");

  const html = `
<!doctype html>
<html>
	<head lang="en">
		<meta charset="utf-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<title>Unsubscribe - ASWNN</title>
	</head>
	<body>
		<form action="/api/email/unsubscribe" autocomplete="on" method="POST">
			<input autocomplete="email" name="email" type="email" value="${email}" />
			<input name="t" type="hidden" value="${token}" />
			<button type="submit">Unsubscribe</button>
		</form>
	</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
    },
    status: 200,
  });
};

const runUnsubscribe = async (email: string): Promise<Response> => {
  try {
    const result = await unsubscribe({ email });

    return result?.data
      ? htmlResponse("<h1>You have been successfully unsubscribed</h1>", 200)
      : htmlResponse("<h1>Please contact an admin to finish unsubscribing</h1>", 500);
  } catch (error) {
    console.error({ email, error, text: "Error unsubscribing:" });

    return htmlResponse("<h1>Error unsubscribing, please try again later</h1>", 500);
  }
};

export const POST = async (req: NextRequest, _ctx: RouteContext<"/api/email/unsubscribe">): Promise<Response> => {
  const emailOrRejection = parseUnsubscribeForm(await req.formData(), verifyEmailLink);

  if (emailOrRejection instanceof Response) {
    return emailOrRejection;
  }

  return runUnsubscribe(emailOrRejection);
};
