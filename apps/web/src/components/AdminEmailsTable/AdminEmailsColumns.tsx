"use client";

import { type DataTableFeatures, SortableColumnHeader } from "@nfl-pool-monorepo/ui/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";

import { formatAdminTimestamp } from "@/lib/dates";
import { env } from "@/lib/env.client";
import type { getAdminEmails } from "@/server/loaders/email";

export type Email = Awaited<ReturnType<typeof getAdminEmails>>["results"][number];

export const emailColumns: ColumnDef<DataTableFeatures, Email>[] = [
  {
    accessorKey: "EmailID",
    cell: ({ row }) => {
      if (!row.original.EmailHtml) {
        return null;
      }

      return (
        <a
          className="underline"
          href={`${env.NEXT_PUBLIC_SITE_URL}/api/email/${row.original.EmailID}`}
          rel="noreferrer"
          target="_blank"
        >
          View
        </a>
      );
    },
    header: "View",
  },
  {
    accessorFn: (row) => {
      if (row.EmailHtml) {
        return `${row.EmailType} email`;
      }

      if (row.EmailSms) {
        return `${row.EmailType} SMS`;
      }

      return `${row.EmailType} unknown`;
    },
    accessorKey: "EmailType",
    header: ({ column }) => <SortableColumnHeader column={column} title="Type" />,
  },
  {
    accessorKey: "UserName",
    cell: ({ row }) => {
      if (!row.original.UserName) {
        return row.original.EmailTo;
      }

      return (
        <>
          <div>{row.original.UserName}</div>
          <div>{row.original.EmailTo}</div>
        </>
      );
    },
    header: ({ column }) => <SortableColumnHeader column={column} title="To" />,
  },
  {
    accessorKey: "EmailSubject",
    header: ({ column }) => <SortableColumnHeader column={column} title="Subject" />,
  },
  {
    accessorFn: (row) => formatAdminTimestamp(row.EmailCreatedAt),
    accessorKey: "EmailCreatedAt",
    header: ({ column }) => <SortableColumnHeader column={column} title="Sent" />,
  },
];
