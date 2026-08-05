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

import { redirect } from "next/navigation";
import type { FC } from "react";

import AdminUsersDataTable from "@/components/AdminUserTable/AdminUsersDataTable";
import CustomHead from "@/components/CustomHead/CustomHead";
import PageContent from "@/components/PageContent/PageContent";
import { requireAdmin } from "@/lib/auth";
import { getAdminUsers, getTrustedUsersDropdown } from "@/server/loaders/user";

const AdminUsersPage: FC<PageProps<"/admin/users">> = async ({ searchParams }) => {
  const redirectUrl = await requireAdmin();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const [{ count, results: users }, trustedUsers] = await Promise.all([
    getAdminUsers(await searchParams),
    getTrustedUsersDropdown(),
  ]);

  return (
    <div className="h-full flex flex-wrap md:mx-3">
      <CustomHead title="User Admin" />
      <PageContent className="pt-5 md:pt-3 pb-4">
        <div className="flex flex-col min-h-screen py-4 px-6">
          <div className="w-full text-center md:text-start">
            {count} {count === 1 ? "User" : "Users"}
          </div>
          <div className="w-full mt-3">
            <div className="bg-gray-100/80 rounded p-4">
              <AdminUsersDataTable count={count} trustedUsers={trustedUsers} users={users} />
            </div>
          </div>
        </div>
      </PageContent>
    </div>
  );
};

export default AdminUsersPage;
