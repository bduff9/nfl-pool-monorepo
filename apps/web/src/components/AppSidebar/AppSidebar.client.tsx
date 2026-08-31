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
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useTheme } from "next-themes";
import { useQueryState } from "nuqs";
import { type FC, Fragment, useState } from "react";
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

import { onActionError } from "@/lib/actionErrorToast";
import { weekParser } from "@/lib/weekParser";
import { withWeek } from "@/lib/weekSearchParams";
import { registerForSurvivor, unregisterForSurvivor } from "@/server/actions/survivor";
import { setSelectedWeek } from "@/server/actions/week";
import type { getMyTiebreaker } from "@/server/loaders/tiebreaker";

import { ProgressBarLink } from "../ProgressBar/ProgressBar";
import { showAccountLinks } from "./navVisibility";
import { SidebarNavigation } from "./SidebarNavigation";

const getInitials = (fullName: string | null): string => {
  if (!fullName) return "";

  const names = fullName.split(" ");
  const initials = names.map((name) => name[0]?.toUpperCase()).join("");

  return initials;
};

// usePathname() always returns the current, already-valid route, so this is a safe escape hatch
// for typedRoutes' branded `Route` type.
const asRoute = (pathname: string): Route => pathname as Route;

const changeWeek = (week: number): void => {
  // Best-effort: persists the week preference for future visits with no `week` in the URL.
  // The navigation itself is already driven by the link's href, so a failure here is silent by design.
  setSelectedWeek(week).catch(() => {});
};

type WeekMenuItemProps = {
  currentWeek: number;
  href: Route;
  onSelectWeek: (week: number) => void;
  selectedWeek: number;
  week: number;
};

const WeekMenuItem: FC<WeekMenuItemProps> = ({ currentWeek, href, onSelectWeek, selectedWeek, week }) => {
  const handleClick = () => {
    onSelectWeek(week);
  };

  const transitionTypes: string[] = week > selectedWeek ? ["nav-forward"] : week < selectedWeek ? ["nav-back"] : [];

  return (
    <Fragment>
      {week === currentWeek && <DropdownMenuSeparator />}
      <DropdownMenuItem asChild>
        <ProgressBarLink href={href} onClick={handleClick} prefetch={true} transitionTypes={transitionTypes}>
          Week {week}
        </ProgressBarLink>
      </DropdownMenuItem>
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
  selectedWeek: selectedWeekProp,
  selectedWeekStatus,
  survivorMvCount,
  user,
  weeklyMvCount,
}) => {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [weekParam] = useQueryState("week", weekParser);
  const selectedWeek = weekParam ?? selectedWeekProp;
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
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

  let currentPage = "";

  const handlePreviousWeek = () => {
    changeWeek(selectedWeek - 1);
  };

  const handleNextWeek = () => {
    changeWeek(selectedWeek + 1);
  };

  const handleGoToCurrentWeek = () => {
    changeWeek(currentWeek);
  };

  const handleRegisterForSurvivor = (): void => {
    executeRegister();
  };

  const handleUnregisterForSurvivor = (): void => {
    executeUnregister();
  };

  const registerDialog = {
    isPending: isRegisterPending,
    onConfirm: handleRegisterForSurvivor,
    open: registerDialogOpen,
    setOpen: setRegisterDialogOpen,
  };

  const unregisterDialog = {
    isPending: isUnregisterPending,
    onConfirm: handleUnregisterForSurvivor,
    open: unregisterDialogOpen,
    setOpen: setUnregisterDialogOpen,
  };

  const handleEditAccountClick = () => {
    setUserMenuOpen(false);
    setOpenMobile(false);
  };

  const handleViewPaymentsClick = () => {
    setUserMenuOpen(false);
    setOpenMobile(false);
  };

  const handleThemeToggleClick = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
    setUserMenuOpen(false);
  };

  const handleSignOutClick = () => {
    setUserMenuOpen(false);
    setOpenMobile(false);
  };

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
            {selectedWeek > 1 ? (
              <Button asChild className="p-0 m-0 [&_svg]:size-6" size="icon" variant="ghost">
                <ProgressBarLink
                  aria-label="Previous week"
                  href={withWeek(asRoute(pathname), selectedWeek - 1)}
                  onClick={handlePreviousWeek}
                  prefetch={true}
                  transitionTypes={["nav-back"]}
                >
                  <LuChevronLeft />
                </ProgressBarLink>
              </Button>
            ) : (
              <span className="invisible size-9" />
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="font-extrabold text-2xl">
                  Week {selectedWeek}
                  <LuChevronDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
                {Array.from({ length: WEEKS_IN_SEASON }, (_, i) => i + 1).map((week) => (
                  <WeekMenuItem
                    currentWeek={currentWeek}
                    href={withWeek(asRoute(pathname), week)}
                    key={`week-${week}`}
                    onSelectWeek={changeWeek}
                    selectedWeek={selectedWeek}
                    week={week}
                  />
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {selectedWeek < WEEKS_IN_SEASON ? (
              <Button asChild className="p-0 m-0 [&_svg]:size-6" size="icon" variant="ghost">
                <ProgressBarLink
                  aria-label="Next week"
                  href={withWeek(asRoute(pathname), selectedWeek + 1)}
                  onClick={handleNextWeek}
                  prefetch={true}
                  transitionTypes={["nav-forward"]}
                >
                  <LuChevronRight />
                </ProgressBarLink>
              </Button>
            ) : (
              <span className="invisible size-9" />
            )}
          </SidebarMenuItem>
          <SidebarMenuItem className={cn("h-9 -m-2 text-center", user.doneRegistering !== 1 && "invisible")}>
            {currentWeek !== selectedWeek && (
              <Button asChild variant="ghost">
                <ProgressBarLink
                  href={withWeek(asRoute(pathname), currentWeek)}
                  onClick={handleGoToCurrentWeek}
                  prefetch={true}
                  transitionTypes={currentWeek > selectedWeek ? ["nav-forward"] : ["nav-back"]}
                >
                  <LuReply />
                  &nbsp;Go to current week
                </ProgressBarLink>
              </Button>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarNavigation
        currentPage={currentPage}
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
                {showAccountLinks(user) && (
                  <DropdownMenuItem>
                    <ProgressBarLink href="/users/edit" onClick={handleEditAccountClick}>
                      Edit Account
                    </ProgressBarLink>
                  </DropdownMenuItem>
                )}
                {showAccountLinks(user) && (
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
