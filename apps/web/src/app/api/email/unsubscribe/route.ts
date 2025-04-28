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

import { unsubscribe } from "@/server/actions/email";
import type { NextRequest } from "next/server";

export const GET = async (req: NextRequest): Promise<Response> => {
	const { nextUrl } = req;
	const { searchParams } = nextUrl;
	const email = searchParams.get('email') ?? '';

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
			<button type="submit">Unsubscribe</button>
		</form>
	</body>
</html>`;

	return new Response(html, {
		status: 200,
		headers: {
			'Content-Type': 'text/html',
		},
	});
};

export const POST = async (req: NextRequest): Promise<Response> => {
	const formData = await req.formData();
	const email = formData.get('email') as string;

	try {
		const [data] = await unsubscribe({ email });

		if (data) {
			return new Response('<h1>You have been successfully unsubscribed</h1>', {
				status: 200,
				headers: {
					'Content-Type': 'text/html',
				},
			});
		} else {
			return new Response('<h1>Please contact an admin to finish unsubscribing</h1>', {
				status: 500,
				headers: {
					'Content-Type': 'text/html',
				},
			});
		}
	} catch (error) {
		console.error({ text: 'Error unsubscribing:', email, error });

		return new Response('<h1>Error unsubscribing, please try again later</h1>', {
			status: 500,
			headers: {
				'Content-Type': 'text/html',
			},
		});
	}
};
