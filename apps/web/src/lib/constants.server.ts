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
import 'server-only';
import { z } from 'zod';

const serverEnv = z.object({
	AWS_AK_ID: z.string(),
	AWS_R: z.string(),
	AWS_SAK_ID: z.string(),
	DATABASE_URL: z.string(),
	domain: z.string().url(),
	EMAIL_FROM: z.string(),
	GOOGLE_ID: z.string(),
	GOOGLE_SECRET: z.string(),
	secret: z.string(),
	TWITTER_ID: z.string(),
	TWITTER_SECRET: z.string(),
	VERCEL_ENV: z.enum(['development', 'preview', 'production']),
});

export const {
	AWS_AK_ID,
	AWS_R,
	AWS_SAK_ID,
	DATABASE_URL,
	domain,
	EMAIL_FROM,
	GOOGLE_ID,
	GOOGLE_SECRET,
	secret,
	TWITTER_ID,
	TWITTER_SECRET,
	VERCEL_ENV,
} = serverEnv.parse(process.env);

/**
 * Prefix used for all communications
 */
export const EMAIL_SUBJECT_PREFIX = '[NFL Confidence Pool] ';
