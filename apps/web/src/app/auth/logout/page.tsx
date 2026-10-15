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

import "server-only";

import type { Metadata } from "next";
import type { FC } from "react";

import LogoutClient from "@/components/LogoutClient/logout";
import PageTransition from "@/components/ViewTransitions/PageTransition";

const TITLE = "Logout";

export const metadata: Metadata = {
  title: TITLE,
};

// No login required: a visitor whose session already expired still holds a dead cookie, and signing out is what clears it
const Logout: FC<PageProps<"/auth/logout">> = () => (
  <PageTransition>
    <div className="text-center w-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <LogoutClient />
    </div>
  </PageTransition>
);

export default Logout;
