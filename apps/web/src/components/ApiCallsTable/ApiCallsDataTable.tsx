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

import type { loadAPICalls } from "@/server/loaders/apiCall";

import { getApiCallColumns } from "./ApiCallsColumns";

type ApiCallsDataTableProps = {
  count: number;
  results: Awaited<ReturnType<typeof loadAPICalls>>["results"];
};

const ApiCallsDataTable: FC<ApiCallsDataTableProps> = ({ count, results }) => {
  return (
    <DataTable
      columns={getApiCallColumns()}
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
  );
};

export default ApiCallsDataTable;
