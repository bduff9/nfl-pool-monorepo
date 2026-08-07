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

"use client";

import { DataTable } from "@nfl-pool-monorepo/ui/components/data-table";
import type { FC } from "react";

import type { getAdminLogs } from "@/server/loaders/log";

import { getLogColumns } from "./AdminLogColumns";

type AdminLogsDataTableProps = {
  count: number;
  results: Awaited<ReturnType<typeof getAdminLogs>>["results"];
};

const AdminLogsDataTable: FC<AdminLogsDataTableProps> = ({ count, results }) => {
  return (
    <DataTable
      columns={getLogColumns()}
      data={results}
      defaultSort={[{ desc: true, id: "LogAdded" }]}
      filters={[
        { field: "LogAction", placeholder: "Select action", type: "text" },
        { field: "UserName", placeholder: "Select user", type: "text" },
      ]}
      rowCount={count}
    />
  );
};

export default AdminLogsDataTable;
