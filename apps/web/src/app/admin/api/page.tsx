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
import type { FC } from "react";

import { apiCallColumns } from "@/components/ApiCallsTable/ApiCallsColumns";
import CustomHead from "@/components/CustomHead/CustomHead";
import { requireAdmin } from "@/lib/auth";
import { loadAPICalls } from "@/server/loaders/apiCall";

const AdminAPICalls: FC<PageProps<"/admin/api">> = async ({ searchParams }) => {
  const redirectUrl = await requireAdmin();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const { count, results } = await loadAPICalls(await searchParams);

  return (
    <div className="h-full flex flex-col">
      <CustomHead title="API History" />
      <div className={cn("bg-gray-100/80 text-black mx-2 pt-3 flex-1 min-h-screen")}>
        <div className="flex flex-col min-h-screen py-4 px-6">
          <div className="w-full text-center md:text-start">
            {count} {count === 1 ? "API Call" : "API Calls"}
          </div>
          <div className="w-full mt-3">
            <div className="bg-gray-100/80 rounded">
              <DataTable
                columns={apiCallColumns}
                data={results}
                filters={[
                  {
                    field: "ApiCallWeek",
                    placeholder: "Filter weeks...",
                    type: "week",
                  },
                ]}
                rowCount={count}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAPICalls;
