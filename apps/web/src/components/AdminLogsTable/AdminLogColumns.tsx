"use client";

import { type DataTableFeatures, SortableColumnHeader } from "@nfl-pool-monorepo/ui/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";

import { formatAdminTimestamp } from "@/lib/dates";
import type { getAdminLogs } from "@/server/loaders/log";

export type Log = Awaited<ReturnType<typeof getAdminLogs>>["results"][number];

export const logColumns: ColumnDef<DataTableFeatures, Log>[] = [
  {
    accessorKey: "LogAction",
    header: ({ column }) => <SortableColumnHeader column={column} title="Action" />,
  },
  {
    accessorKey: "UserName",
    header: ({ column }) => <SortableColumnHeader column={column} title="User" />,
  },
  {
    accessorKey: "LogMessage",
    header: ({ column }) => <SortableColumnHeader column={column} title="Message" />,
  },
  {
    accessorFn: (row) => formatAdminTimestamp(row.LogAdded),
    accessorKey: "LogAdded",
    header: ({ column }) => <SortableColumnHeader column={column} title="Date" />,
  },
];
