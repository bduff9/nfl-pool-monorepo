"use client";

import { DataTable } from "@nfl-pool-monorepo/ui/components/data-table";
import type { FC } from "react";

import type { getAdminUsers, getTrustedUsersDropdown } from "@/server/loaders/user";

import { getUserColumns } from "./AdminUserColumns";

type AdminUsersDataTableProps = {
  count: number;
  trustedUsers: Awaited<ReturnType<typeof getTrustedUsersDropdown>>;
  users: Awaited<ReturnType<typeof getAdminUsers>>["results"];
};

const AdminUsersDataTable: FC<AdminUsersDataTableProps> = ({ count, trustedUsers, users }) => {
  return (
    <DataTable
      columns={getUserColumns(trustedUsers)}
      columnVisibility={{
        UserIsOwing: false,
        UserStatus2: false,
        UserStatus3: false,
      }}
      data={users}
      defaultSort={[
        {
          desc: false,
          id: "UserName",
        },
      ]}
      filters={[
        {
          field: "UserStatus2",
          options: [
            {
              label: "Registered",
              value: "Registered",
            },
            {
              label: "Inactive",
              value: "Inactive",
            },
            {
              label: "Incomplete",
              value: "Incomplete",
            },
          ],
          placeholder: "Filter user status...",
          type: "dropdown",
        },
        {
          field: "UserStatus3",
          options: [
            {
              label: "Rookie",
              value: "Rookie",
            },
            {
              label: "Veteran",
              value: "Veteran",
            },
          ],
          placeholder: "Filter rookie/veteran...",
          type: "dropdown",
        },
        {
          field: "UserIsOwing",
          options: [
            {
              label: "Yes",
              value: "1",
            },
            {
              label: "No",
              value: "0",
            },
          ],
          placeholder: "Filter users that owe money...",
          type: "dropdown",
        },
      ]}
      rowCount={count}
    />
  );
};

export default AdminUsersDataTable;
