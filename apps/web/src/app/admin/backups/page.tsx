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

import { cn } from "@nfl-pool-monorepo/utils/styles";
import { redirect } from "next/navigation";
import type { FC } from "react";

import BackupsTable from "@/components/BackupsTable/BackupsTable";
import CustomHead from "@/components/CustomHead/CustomHead";
import { requireAdmin } from "@/lib/auth";
import { getAdminBackups } from "@/server/loaders/backup";

const AdminBackupsPage: FC<PageProps<"/admin/backups">> = async () => {
  const redirectUrl = await requireAdmin();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const { count, results } = await getAdminBackups();

  return (
    <div className="h-full flex flex-col">
      <CustomHead title="Backups Admin" />
      <div className={cn("bg-gray-100/80 text-black mx-2 pt-3 flex-1 min-h-screen")}>
        <BackupsTable count={count} results={results} />
      </div>
    </div>
  );
};

export default AdminBackupsPage;
