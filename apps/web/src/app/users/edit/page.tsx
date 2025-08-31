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
import "server-only";

import CustomHead from "@/components/CustomHead/CustomHead";
import EditProfileForm from "@/components/EditProfileForm/EditProfileForm";
import { requireRegistered } from "@/lib/auth";
import { editMyProfile } from "@/server/actions/user";
import { getUserNotifications } from "@/server/loaders/notification";
import { getCurrentUser, userHasGoogle } from "@/server/loaders/user";

const EditProfile: FC<PageProps<"/users/edit">> = async () => {
  const redirectPath = await requireRegistered();

  if (redirectPath) {
    return redirect(redirectPath);
  }

  const currentUser = await getCurrentUser();

  const hasGooglePromise = userHasGoogle(currentUser.UserID);
  const myNotificationsPromise = getUserNotifications(currentUser.UserID);

  const [hasGoogle, myNotifications] = await Promise.all([hasGooglePromise, myNotificationsPromise]);

  return (
    <div className="h-full flex flex-wrap md:mx-3">
      <CustomHead title="Edit My Profile" />
      <div className="bg-gray-100/80 text-black pt-5 md:pt-4 min-h-screen pb-6 px-3 grow shrink-0">
        <EditProfileForm
          action={editMyProfile}
          currentUser={currentUser}
          hasGoogle={hasGoogle}
          myNotifications={myNotifications}
        />
      </div>
    </div>
  );
};

export default EditProfile;
