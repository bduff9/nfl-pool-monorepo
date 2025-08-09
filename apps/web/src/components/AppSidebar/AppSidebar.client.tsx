"use client";

import type { Status, User } from "@nfl-pool-monorepo/types";
import { Avatar, AvatarFallback, AvatarImage } from "@nfl-pool-monorepo/ui/components/avatar";
import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@nfl-pool-monorepo/ui/components/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@nfl-pool-monorepo/ui/components/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@nfl-pool-monorepo/ui/components/sidebar";
import { WEEKS_IN_SEASON } from "@nfl-pool-monorepo/utils/constants";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import { usePathname, useRouter } from "next/navigation";
import { type FC, Fragment, startTransition, useCallback } from "react";
import { LuChevronDown, LuChevronLeft, LuChevronRight, LuEllipsisVertical, LuReply } from "react-icons/lu";

import { processFormState } from "@/lib/zsa";
import { registerForSurvivor, unregisterForSurvivor } from "@/server/actions/survivor";
import { setSelectedWeek } from "@/server/actions/week";
import type { getMyTiebreaker } from "@/server/loaders/tiebreaker";

import NavLink from "../NavLink/NavLink";
import { ProgressBarLink, useProgressBar } from "../ProgressBar/ProgressBar";

const getInitials = (fullName: string | null): string => {
  if (!fullName) return "";

  const names = fullName.split(" ");
  const initials = names.map((name) => name[0]?.toUpperCase()).join("");

  return initials;
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
  const pathname = usePathname();
  const router = useRouter();
  const progress = useProgressBar();
  let currentPage = "";

  const goToPreviousWeek = (): void => {
    const newWeek = --selectedWeek;

    progress.start();

    startTransition(async () => {
      await setSelectedWeek(newWeek < 1 ? selectedWeek : newWeek);
      router.refresh();
      progress.done();
    });
  };

  const goToCurrentWeek = useCallback((): void => {
    if (currentWeek) {
      progress.start();

      startTransition(async () => {
        await setSelectedWeek(currentWeek);
        router.refresh();
        progress.done();
      });
    }
  }, [currentWeek, progress.done, progress.start, router.refresh]);

  const goToNextWeek = (): void => {
    const newWeek = ++selectedWeek;

    progress.start();

    startTransition(async () => {
      await setSelectedWeek(newWeek > WEEKS_IN_SEASON ? selectedWeek : newWeek);
      router.refresh();
      progress.done();
    });
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
            <Button
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
                {Array.from({ length: WEEKS_IN_SEASON }).map((_, i) => (
                  <Fragment key={`week-${i + 1}`}>
                    {i + 1 === currentWeek && <DropdownMenuSeparator />}
                    <DropdownMenuItem onClick={() => setSelectedWeek(i + 1)}>Week {i + 1}</DropdownMenuItem>
                    {i + 1 === currentWeek && <DropdownMenuSeparator />}
                  </Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
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
      {user.doneRegistering === 1 ? (
        <SidebarContent>
          <Collapsible className="group/collapsible" defaultOpen={currentPage === "Dashboard"}>
            <SidebarGroup>
              <SidebarGroupLabel asChild className="text-2xl text-white">
                <CollapsibleTrigger>
                  Dashboard
                  <LuChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <NavLink href="/" isNested>
                    My Dashboard
                  </NavLink>
                  <NavLink href="/weekly" isNested show={weeklyMvCount > 0}>
                    Week Results
                  </NavLink>
                  <NavLink href="/overall" isNested show={overallMvCount > 0}>
                    Overall Results
                  </NavLink>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>

          <Collapsible className="group/collapsible" defaultOpen={currentPage === "Picks"}>
            <SidebarGroup>
              <SidebarGroupLabel asChild className="text-2xl text-white">
                <CollapsibleTrigger>
                  Picks
                  <LuChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <NavLink href="/picks/set" isNested show={myTiebreaker?.TiebreakerHasSubmitted !== 1}>
                    Make Picks
                  </NavLink>
                  <NavLink href="/picks/view" isNested>
                    View My Picks
                  </NavLink>
                  <NavLink
                    href="/picks/viewall"
                    isNested
                    show={weeklyMvCount > 0 && myTiebreaker?.TiebreakerHasSubmitted === 1}
                  >
                    View All Picks
                  </NavLink>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>

          <Collapsible className="group/collapsible" defaultOpen={currentPage === "Survivor"}>
            <SidebarGroup>
              <SidebarGroupLabel asChild className="text-2xl text-white">
                <CollapsibleTrigger>
                  Survivor
                  <LuChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <NavLink
                    isNested
                    onClick={async () => {
                      const result = await registerForSurvivor();

                      processFormState(
                        result,
                        () => router.refresh(),
                        "You have successfully registered for survivor!",
                      );
                    }}
                    show={!(hasSeasonStarted || user.playsSurvivor)}
                  >
                    Register for Survivor
                  </NavLink>
                  <NavLink
                    isNested
                    onClick={async () => {
                      const result = await unregisterForSurvivor();

                      processFormState(
                        result,
                        () => router.refresh(),
                        "You have successfully dropped out of survivor!",
                      );
                    }}
                    show={!hasSeasonStarted && !!user.playsSurvivor}
                  >
                    Drop out of Survivor
                  </NavLink>
                  <NavLink
                    href="/survivor/set"
                    isNested
                    show={!!user.playsSurvivor && isAliveInSurvivor && selectedWeekStatus === "Not Started"}
                  >
                    Make Picks
                  </NavLink>
                  <NavLink href="/survivor/view" isNested show={survivorMvCount > 0}>
                    View Picks
                  </NavLink>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>

          <SidebarMenuButton asChild>
            <NavLink href="/scoreboard" show={!!user.doneRegistering}>
              NFL Scoreboard
            </NavLink>
          </SidebarMenuButton>

          <SidebarMenuButton asChild>
            <NavLink href="/support">Help</NavLink>
          </SidebarMenuButton>

          {user.isAdmin === 1 && (
            <Collapsible className="group/collapsible" defaultOpen={currentPage === "Admin"}>
              <SidebarGroup>
                <SidebarGroupLabel asChild className="text-2xl text-white">
                  <CollapsibleTrigger>
                    Admin
                    <LuChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <NavLink href="/admin/api" isNested>
                      API Logs
                    </NavLink>
                    <NavLink href="/admin/backups" isNested>
                      Backups
                    </NavLink>
                    <NavLink href="/admin/email" isNested>
                      Emails
                    </NavLink>
                    <NavLink href="/admin/logs" isNested>
                      Logs
                    </NavLink>
                    <NavLink href="/admin/payments" isNested>
                      Payments
                    </NavLink>
                    <NavLink href="/admin/users" isNested>
                      Users
                    </NavLink>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          )}
        </SidebarContent>
      ) : (
        <SidebarContent>
          <SidebarMenuButton asChild>
            <NavLink href="/users/create">Finish Registration</NavLink>
          </SidebarMenuButton>

          <SidebarMenuButton asChild>
            <NavLink href="/support">Help</NavLink>
          </SidebarMenuButton>
        </SidebarContent>
      )}

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
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
                    <ProgressBarLink href="/users/edit">Edit Account</ProgressBarLink>
                  </DropdownMenuItem>
                )}
                {user.doneRegistering === 1 && (
                  <DropdownMenuItem>
                    <ProgressBarLink href="/users/payments">View Payments</ProgressBarLink>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <ProgressBarLink href="/auth/logout">Sign out</ProgressBarLink>
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
