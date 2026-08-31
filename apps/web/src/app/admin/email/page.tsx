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
import { type FC, Suspense } from "react";

import AdminEmailsDataTable from "@/components/AdminEmailsTable/AdminEmailsDataTable";
import CustomHead from "@/components/CustomHead/CustomHead";
import PageContent from "@/components/PageContent/PageContent";
import SendAdminEmails from "@/components/SendAdminEmails/SendAdminEmails";
import { requireAdmin } from "@/lib/auth";
import { getAdminEmails } from "@/server/loaders/email";

import AdminLoading from "../loading";

const AdminEmailPageBody: FC<PageProps<"/admin/email">> = async ({ searchParams }) => {
  const redirectUrl = await requireAdmin();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const { count, results } = await getAdminEmails(await searchParams);

  return (
    <div className="h-full flex flex-col md:mx-3">
      <CustomHead title="Email Users" />
      <PageContent>
        <SendAdminEmails />

        <div className="flex flex-col">
          <div className="w-full mt-4 p-4 pt-2 border rounded">
            <div className="w-full text-center md:text-start">
              {count} {count === 1 ? "email" : "emails"}
            </div>
            <div className="w-full">
              <AdminEmailsDataTable count={count} results={results} />
            </div>
          </div>
        </div>
      </PageContent>
    </div>
  );
};

const AdminEmail: FC<PageProps<"/admin/email">> = (props) => (
  <Suspense fallback={<AdminLoading />}>
    <AdminEmailPageBody {...props} />
  </Suspense>
);

export default AdminEmail;
