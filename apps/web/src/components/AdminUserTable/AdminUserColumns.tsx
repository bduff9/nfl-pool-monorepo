"use client";

import { type DataTableFeatures, SortableColumnHeader } from "@nfl-pool-monorepo/ui/components/data-table";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { ColumnDef } from "@tanstack/react-table";
import { FaEnvelope } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

import type { getAdminUsers } from "@/server/loaders/user";

import { UserRowActions } from "./UserRowActions";

export type User = Awaited<ReturnType<typeof getAdminUsers>>["results"][number];

export const userColumns: ColumnDef<DataTableFeatures, User>[] = [
  {
    accessorKey: "UserName",
    cell: ({ row }) => {
      return (
        <>
          <div className="font-bold" title={row.original.UserName ?? undefined}>
            {row.original.UserFirstName} {row.original.UserLastName}
          </div>
          <div className="text-muted">
            {row.original.UserTeamName ||
              (row.original.UserFirstName ? `${row.original.UserFirstName}'s Team` : "No team name")}
          </div>
        </>
      );
    },
    header: ({ column }) => <SortableColumnHeader column={column} title="Name" />,
  },
  {
    cell: ({ row }) => <UserRowActions user={row.original} />,
    header: "",
    id: "Actions",
  },
  {
    accessorKey: "UserEmail",
    cell: ({ row }) => {
      return (
        <>
          {row.original.UserEmail}
          {row.original.UserCommunicationsOptedOut === 1 && <div className="text-red-600">Unsubscribed</div>}
        </>
      );
    },
    header: ({ column }) => <SortableColumnHeader column={column} title="Email" />,
  },
  {
    accessorFn: (row) => row.referredByUserName ?? row.UserReferredByRaw,
    header: "Referral",
  },
  {
    accessorKey: "UserStatus",
    cell: ({ row }) => {
      return (
        <div
          className={cn(
            row.original.UserStatus === "Registered" && "text-green-600",
            row.original.UserStatus === "Unverified" && "text-red-600",
            row.original.UserStatus === "Untrusted" && "text-amber-600",
            row.original.UserStatus === "Verified" && "text-muted",
          )}
          title={`Years played: ${row.original.YearsPlayed}`}
        >
          {row.original.UserStatus}
        </div>
      );
    },
    header: ({ column }) => <SortableColumnHeader column={column} title="Status" />,
  },
  {
    accessorKey: "UserNotifications",
    cell: ({ row }) => {
      return row.original.UserNotifications.map((notification) => (
        <div className="flex-1 text-nowrap" key={`notification-${notification.NotificationID}`}>
          {notification.NotificationTypeDescription}:{" "}
          {notification.NotificationEmail ? `E${notification.NotificationEmailHoursBefore ?? ""}` : ""}{" "}
          {notification.NotificationSMS ? `S${notification.NotificationSMSHoursBefore ?? ""}` : ""}
        </div>
      ));
    },
    header: "Notifications",
  },
  {
    accessorFn: (row) => `${row.UserAutoPickStrategy}: ${row.UserAutoPicksLeft}`,
    header: ({ column }) => <SortableColumnHeader column={column} title="Auto Picks" />,
    id: "Auto Picks",
  },
  {
    cell: ({ row }) => {
      return (
        <div className="flex gap-2">
          {row.original.UserHasPassword === 1 && (
            <FaEnvelope className="text-yellow-400 size-6" title="Email sign in" />
          )}
          {row.original.UserHasGoogle === 1 && <FcGoogle className="size-6" title="Google sign in" />}
        </div>
      );
    },
    header: "Logins",
    id: "Logins",
  },
  {
    accessorKey: "UserStatus2",
    header: "UserStatus2",
    id: "UserStatus2",
  },
  {
    accessorKey: "UserStatus3",
    header: "UserStatus3",
    id: "UserStatus3",
  },
  {
    accessorKey: "UserIsOwing",
    header: "UserIsOwing",
    id: "UserIsOwing",
  },
];
