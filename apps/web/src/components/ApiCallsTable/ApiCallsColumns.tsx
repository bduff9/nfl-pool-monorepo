"use client"


import { SortableColumnHeader } from "@nfl-pool-monorepo/ui/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import JsonView from "@uiw/react-json-view";
import { githubDarkTheme } from "@uiw/react-json-view/githubDark";

import type { loadAPICalls } from "@/server/loaders/apiCall";

export type ApiCall = Awaited<ReturnType<typeof loadAPICalls>>['results'][number];

export const apiCallColumns: ColumnDef<ApiCall>[] = [
  {
    accessorKey: "ApiCallUrl",
    cell: ({ row }) => <a className="underline" href={row.original.ApiCallUrl} rel="noopener noreferrer" target="_blank">{row.original.ApiCallUrl}</a>,
    header: ({ column }) => (
			<SortableColumnHeader
				column={column}
				title="URL"
			/>
		),
  },
  {
    accessorKey: "ApiCallYear",
    header: ({ column }) => (
      <SortableColumnHeader
        column={column}
        title="Year"
      />
    ),
  },
  {
    accessorKey: "ApiCallWeek",
    header: ({ column }) => (
      <SortableColumnHeader
        column={column}
        title="Week"
      />
    ),
  },
  {
		accessorFn: (row) => row.ApiCallDate.toString(),
    accessorKey: "ApiCallDate",
    header: ({ column }) => (
      <SortableColumnHeader
        column={column}
        title="Date"
      />
    ),
  },
  {
    accessorKey: "ApiCallResponse",
		cell: ({ row }) => <JsonView collapsed style={githubDarkTheme} value={row.original.ApiCallResponse as object} />,
    header: "Response",
  },
];
