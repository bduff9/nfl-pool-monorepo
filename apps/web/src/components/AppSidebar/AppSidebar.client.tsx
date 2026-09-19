"use client";

import type { Status, User } from "@nfl-pool-monorepo/types";
import { Sidebar, SidebarRail, useSidebar } from "@nfl-pool-monorepo/ui/components/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useQueryState } from "nuqs";
import { type FC, useState } from "react";
import { toast } from "sonner";

import { onActionError } from "@/lib/actionErrorToast";
import { weekParser } from "@/lib/weekParser";
import { registerForSurvivor, unregisterForSurvivor } from "@/server/actions/survivor";
import { setSelectedWeek } from "@/server/actions/week";
import type { getMyTiebreaker } from "@/server/loaders/tiebreaker";

import { SidebarNavigation } from "./SidebarNavigation";
import { SidebarUserMenu } from "./SidebarUserMenu";
import { SidebarWeekHeader } from "./SidebarWeekHeader";

const changeWeek = (week: number): void => {
  // Best-effort: persists the week preference for future visits with no `week` in the URL.
  // The navigation itself is already driven by the link's href, so a failure here is silent by design.
  setSelectedWeek(week).catch(() => {});
};

// fallow-ignore-next-line complexity -- plain route-to-label lookup extracted from the formerly-CRITICAL AppSidebarClient
const getCurrentPage = (pathname: string): string => {
  if (pathname.startsWith("/picks")) return "Picks";
  if (pathname.startsWith("/survivor")) return "Survivor";
  if (pathname.startsWith("/users")) return "My Account";
  if (pathname.startsWith("/admin")) return "Admin";
  if (["/", "/weekly", "/overall"].includes(pathname)) return "Dashboard";

  return "";
};

type Props = {
  currentWeek: number;
  hasSeasonStarted: boolean;
  isAliveInSurvivor: boolean;
  myTiebreaker: Awaited<ReturnType<typeof getMyTiebreaker>>;
  overallMvCount: number;
  selectedWeek: number;
  selectedWeekStatus: Status;
  survivorMvCount: number;
  user: User;
  weeklyMvCount: number;
};

const AppSidebarClient: FC<Props> = ({
  currentWeek,
  hasSeasonStarted,
  isAliveInSurvivor,
  myTiebreaker,
  overallMvCount,
  selectedWeek: selectedWeekProp,
  selectedWeekStatus,
  survivorMvCount,
  user,
  weeklyMvCount,
}) => {
  const { isMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [weekParam] = useQueryState("week", weekParser);
  const selectedWeek = weekParam ?? selectedWeekProp;
  const [registerDialogOpen, setRegisterDialogOpen] = useState<boolean>(false);
  const [unregisterDialogOpen, setUnregisterDialogOpen] = useState<boolean>(false);

  const { execute: executeRegister, isPending: isRegisterPending } = useAction(registerForSurvivor, {
    onError: onActionError,
    onSuccess: () => {
      toast.success("You have successfully registered for survivor!");
      router.refresh();
      setRegisterDialogOpen(false);
    },
  });

  const { execute: executeUnregister, isPending: isUnregisterPending } = useAction(unregisterForSurvivor, {
    onError: onActionError,
    onSuccess: () => {
      toast.success("You have successfully dropped out of survivor!");
      router.refresh();
      setUnregisterDialogOpen(false);
    },
  });

  const registerDialog = {
    isPending: isRegisterPending,
    onConfirm: () => executeRegister(),
    open: registerDialogOpen,
    setOpen: setRegisterDialogOpen,
  };

  const unregisterDialog = {
    isPending: isUnregisterPending,
    onConfirm: () => executeUnregister(),
    open: unregisterDialogOpen,
    setOpen: setUnregisterDialogOpen,
  };

  const handleCloseMobileSidebar = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar>
      <SidebarWeekHeader
        currentWeek={currentWeek}
        onSelectWeek={changeWeek}
        pathname={pathname}
        selectedWeek={selectedWeek}
        user={user}
      />
      <SidebarNavigation
        currentPage={getCurrentPage(pathname)}
        hasSeasonStarted={hasSeasonStarted}
        isAliveInSurvivor={isAliveInSurvivor}
        myTiebreaker={myTiebreaker}
        overallMvCount={overallMvCount}
        registerDialog={registerDialog}
        selectedWeekStatus={selectedWeekStatus}
        survivorMvCount={survivorMvCount}
        unregisterDialog={unregisterDialog}
        user={user}
        weeklyMvCount={weeklyMvCount}
      />
      <SidebarUserMenu isMobile={isMobile} onNavigate={handleCloseMobileSidebar} user={user} />
      <SidebarRail />
    </Sidebar>
  );
};

export default AppSidebarClient;
