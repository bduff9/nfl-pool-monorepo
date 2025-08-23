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
import type { FC } from "react";

import { userColumns } from "@/components/AdminUserTable/AdminUserColumns";
import CustomHead from "@/components/CustomHead/CustomHead";
import { getAdminUsers } from "@/server/loaders/user";

const AdminUsersPage: FC<PageProps<"/admin/users">> = async ({ searchParams }) => {
  const { count, results: users } = await getAdminUsers(await searchParams);

  return (
    <div className="h-full flex flex-col">
      <CustomHead title="User Admin" />
      <div className={cn("bg-gray-100/80 text-black mx-2 pt-5 md:pt-3 min-h-screen pb-4 flex-1")}>
        <div className="flex flex-col min-h-screen py-4 px-6">
          <div className="w-full text-center md:text-start">
            {count} {count === 1 ? "User" : "Users"}
          </div>
          <div className="w-full mt-3">
            <div className="bg-gray-100/80 rounded p-4">
              <DataTable
                columns={userColumns}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
