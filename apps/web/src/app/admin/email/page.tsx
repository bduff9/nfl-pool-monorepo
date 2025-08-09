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

import { DataTable } from "@nfl-pool-monorepo/ui/components/data-table";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import { redirect } from "next/navigation";

import { emailColumns } from "@/components/AdminEmailsTable/AdminEmailsColumns";
import CustomHead from "@/components/CustomHead/CustomHead";
import SendAdminEmails from "@/components/SendAdminEmails/SendAdminEmails";
import { requireAdmin } from "@/lib/auth";
import type { NP } from "@/lib/types";
import { getAdminEmails } from "@/server/loaders/email";

const AdminEmail: NP = async ({ searchParams }) => {
  const redirectUrl = await requireAdmin();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const { count, results } = await getAdminEmails(await searchParams);

  return (
    <div className="h-full flex flex-col">
      <CustomHead title="Email Users" />
      <div className={cn("text-black mx-2 flex-1 min-h-screen")}>
        <SendAdminEmails />

        <div className="flex flex-col">
          <div className="w-full bg-gray-100/80 text-black mt-4 p-4 pt-2 border rounded">
            <div className="w-full text-center md:text-start">
              {results.length} {count === 1 ? "email" : "emails"}
            </div>
            <div className="w-full">
              <DataTable
                columns={emailColumns}
                data={results}
                filters={[{ field: "EmailType", placeholder: "Enter email type", type: "text" }]}
                rowCount={count}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEmail;
