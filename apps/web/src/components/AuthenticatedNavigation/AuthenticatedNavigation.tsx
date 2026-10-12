import type { FC } from "react";

import AppSidebar from "@/components/AppSidebar/AppSidebar";
import { CommandMenu } from "@/components/CommandMenu/CommandMenu";
import ForegroundRefresh from "@/components/ForegroundRefresh/ForegroundRefresh.client";
import OfflineSupport from "@/components/OfflineSupport/OfflineSupport.client";
import { getCurrentSession } from "@/server/loaders/sessions";

import { AuthenticatedNavMarker } from "./AuthenticatedNavPresence.client";

const AuthenticatedNavigation: FC = async () => {
  const { user } = await getCurrentSession();

  if (!user) {
    return null;
  }

  return (
    <>
      <AuthenticatedNavMarker />
      <OfflineSupport userId={user.id} />
      <ForegroundRefresh />
      <CommandMenu user={user} />
      <div style={{ viewTransitionName: "persistent-nav" }}>
        <AppSidebar user={user} />
      </div>
    </>
  );
};

export default AuthenticatedNavigation;
