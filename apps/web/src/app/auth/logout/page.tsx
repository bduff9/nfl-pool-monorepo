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
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { FC } from "react";

import CustomHead from "@/components/CustomHead/CustomHead";
import LogoutClient from "@/components/LogoutClient/logout";
import { requireLoggedIn } from "@/lib/auth";

const TITLE = "Logout";

export const metadata: Metadata = {
  title: TITLE,
};

const Logout: FC = async () => {
  const redirectUrl = await requireLoggedIn();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  return (
    <div className="text-center w-100 position-absolute top-50 start-50 translate-middle">
      <CustomHead title={TITLE} />
      <LogoutClient />
    </div>
  );
};

export default Logout;
