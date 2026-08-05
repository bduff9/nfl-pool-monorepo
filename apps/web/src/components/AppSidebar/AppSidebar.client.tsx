"use client";

import type { Status, User } from "@nfl-pool-monorepo/types";
import { Avatar, AvatarFallback, AvatarImage } from "@nfl-pool-monorepo/ui/components/avatar";
import { Button } from "@nfl-pool-monorepo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@nfl-pool-monorepo/ui/components/dropdown-menu";
import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@nfl-pool-monorepo/ui/components/sidebar";
import { WEEKS_IN_SEASON } from "@nfl-pool-monorepo/utils/constants";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import { usePathname, useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useTheme } from "next-themes";
import { type FC, Fragment, startTransition, useCallback, useState } from "react";
import {
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuEllipsisVertical,
  LuMoon,
  LuReply,
  LuSun,
} from "react-icons/lu";
import { toast } from "sonner";

import { registerForSurvivor, unregisterForSurvivor } from "@/server/actions/survivor";
import { setSelectedWeek } from "@/server/actions/week";
import type { getMyTiebreaker } from "@/server/loaders/tiebreaker";

import { ProgressBarLink, useProgressBar } from "../ProgressBar/ProgressBar";
import { SidebarNavigation } from "./SidebarNavigation";

const getInitials = (fullName: string | null): string => {
  if (!fullName) return "";

  const names = fullName.split(" ");
  const initials = names.map((name) => name[0]?.toUpperCase()).join("");

  return initials;
};

type WeekMenuItemProps = {
  currentWeek: number;
  onSelectWeek: (week: number) => void;
  week: number;
};

const WeekMenuItem: FC<WeekMenuItemProps> = ({ currentWeek, onSelectWeek, week }) => {
  const handleClick = useCallback(() => {
    onSelectWeek(week);
  }, [onSelectWeek, week]);

  return (
    <Fragment>
      {week === currentWeek && <DropdownMenuSeparator />}
      <DropdownMenuItem onClick={handleClick}>Week {week}</DropdownMenuItem>
      {week === currentWeek && <DropdownMenuSeparator />}
    </Fragment>
  );
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
  selectedWeek,
  selectedWeekStatus,
  survivorMvCount,
  user,
  weeklyMvCount,
}) => {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const progress = useProgressBar();
  const { resolvedTheme, setTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState<boolean>(false);
  const [unregisterDialogOpen, setUnregisterDialogOpen] = useState<boolean>(false);

  const { execute: executeRegister, isPending: isRegisterPending } = useAction(registerForSurvivor, {
    onError: ({ error }) => {
      toast.error("Something went wrong!", {
        description: error.serverError ?? "Please check the information you are submitting.",
      });
    },
    onSuccess: () => {
      toast.success("You have successfully registered for survivor!");
      router.refresh();
      setRegisterDialogOpen(false);
    },
  });

  const { execute: executeUnregister, isPending: isUnregisterPending } = useAction(unregisterForSurvivor, {
    onError: ({ error }) => {
      toast.error("Something went wrong!", {
        description: error.serverError ?? "Please check the information you are submitting.",
      });
    },
    onSuccess: () => {
      toast.success("You have successfully dropped out of survivor!");
      router.refresh();
      setUnregisterDialogOpen(false);
    },
  });

  let currentPage = "";

  const changeWeek = (week: number): void => {
    progress.start();

    startTransition(async () => {
      await setSelectedWeek(week);
      router.refresh();
      progress.done();
    });
  };

  const goToPreviousWeek = (): void => {
    const newWeek = selectedWeek - 1;

    changeWeek(newWeek < 1 ? selectedWeek : newWeek);
  };

  const goToCurrentWeek = (): void => {
    if (currentWeek) {
      changeWeek(currentWeek);
    }
  };

  const goToNextWeek = (): void => {
    const newWeek = selectedWeek + 1;

    changeWeek(newWeek > WEEKS_IN_SEASON ? selectedWeek : newWeek);
  };

  const handleRegisterForSurvivor = (): void => {
    executeRegister();
  };

  const handleUnregisterForSurvivor = (): void => {
    executeUnregister();
  };

  const handleEditAccountClick = useCallback(() => {
    setUserMenuOpen(false);
    setOpenMobile(false);
  }, [setOpenMobile]);

  const handleViewPaymentsClick = useCallback(() => {
    setUserMenuOpen(false);
    setOpenMobile(false);
  }, [setOpenMobile]);

  const handleThemeToggleClick = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
    setUserMenuOpen(false);
  }, [resolvedTheme, setTheme]);

  const handleSignOutClick = useCallback(() => {
    setUserMenuOpen(false);
    setOpenMobile(false);
  }, [setOpenMobile]);

  if (pathname.startsWith("/picks")) {
    currentPage = "Picks";
  } else if (pathname.startsWith("/survivor")) {
    currentPage = "Survivor";
  } else if (pathname.startsWith("/users")) {
    currentPage = "My Account";
  } else if (pathname.startsWith("/admin")) {
    currentPage = "Admin";
  } else if (["/", "/weekly", "/overall"].includes(pathname)) {
    currentPage = "Dashboard";
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className={cn("flex justify-between", user.doneRegistering !== 1 && "invisible")}>
            <Button
              aria-label="Previous week"
              className={cn("p-0 m-0 [&_svg]:size-6", selectedWeek === 1 && "invisible")}
              onClick={goToPreviousWeek}
              size="icon"
              type="button"
              variant="ghost"
            >
              <LuChevronLeft />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="font-extrabold text-2xl">
                  Week {selectedWeek}
                  <LuChevronDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
                {Array.from({ length: WEEKS_IN_SEASON }, (_, i) => i + 1).map((week) => (
                  <WeekMenuItem currentWeek={currentWeek} key={`week-${week}`} onSelectWeek={changeWeek} week={week} />
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              aria-label="Next week"
              className={cn("p-0 m-0 [&_svg]:size-6", selectedWeek === WEEKS_IN_SEASON && "invisible")}
              onClick={goToNextWeek}
              size="icon"
              type="button"
              variant="ghost"
            >
              <LuChevronRight />
            </Button>
          </SidebarMenuItem>
          <SidebarMenuItem className={cn("h-9 -m-2 text-center", user.doneRegistering !== 1 && "invisible")}>
            {currentWeek !== selectedWeek && (
              <Button onClick={goToCurrentWeek} variant="ghost">
                <LuReply />
                &nbsp;Go to current week
              </Button>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarNavigation
        currentPage={currentPage}
        hasSeasonStarted={hasSeasonStarted}
        isAliveInSurvivor={isAliveInSurvivor}
        isRegisterPending={isRegisterPending}
        isUnregisterPending={isUnregisterPending}
        myTiebreaker={myTiebreaker}
        onRegisterForSurvivor={handleRegisterForSurvivor}
        onUnregisterForSurvivor={handleUnregisterForSurvivor}
        overallMvCount={overallMvCount}
        registerDialogOpen={registerDialogOpen}
        selectedWeekStatus={selectedWeekStatus}
        setRegisterDialogOpen={setRegisterDialogOpen}
        setUnregisterDialogOpen={setUnregisterDialogOpen}
        survivorMvCount={survivorMvCount}
        unregisterDialogOpen={unregisterDialogOpen}
        user={user}
        weeklyMvCount={weeklyMvCount}
      />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu onOpenChange={setUserMenuOpen} open={userMenuOpen}>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <Avatar className="size-10 rounded-lg">
                    <AvatarImage src={user.image ?? undefined} />
                    <AvatarFallback className="size-full text-black rounded-lg">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="truncate font-medium">{user.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <LuEllipsisVertical className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="right">
                {user.doneRegistering === 1 && (
                  <DropdownMenuItem>
                    <ProgressBarLink href="/users/edit" onClick={handleEditAccountClick}>
                      Edit Account
                    </ProgressBarLink>
                  </DropdownMenuItem>
                )}
                {user.doneRegistering === 1 && (
                  <DropdownMenuItem>
                    <ProgressBarLink href="/users/payments" onClick={handleViewPaymentsClick}>
                      View Payments
                    </ProgressBarLink>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleThemeToggleClick}>
                  {resolvedTheme === "dark" ? (
                    <>
                      <LuSun /> Switch to light mode
                    </>
                  ) : (
                    <>
                      <LuMoon /> Switch to dark mode
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ProgressBarLink href="/auth/logout" onClick={handleSignOutClick}>
                    Sign out
                  </ProgressBarLink>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};

export default AppSidebarClient;
