import type { FC } from "react";

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

/**
 * Next.js Page component
 */
export type NP<Props = Record<string, never>> = FC<
  {
    params: Promise<Record<string, string>>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  } & Props
>;

export type TextOrSubject<Props = Record<string, never>> = (props: Props) => string;

/**
 * Season and week status
 */
export type Status = "Not Started" | "In Progress" | "Complete";

export type FormState = {
  status: "UNSET" | "SUCCESS" | "ERROR";
  message: string;
  fieldErrors: Record<string, string[] | undefined>;
  timestamp: number;
};

export type ServerAction = (p: FormState, f: FormData) => Promise<FormState>;
