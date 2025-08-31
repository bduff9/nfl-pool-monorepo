"use client";

import type { Status, User } from "@nfl-pool-monorepo/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@nfl-pool-monorepo/ui/components/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@nfl-pool-monorepo/ui/components/avatar";
import { Button, buttonVariants } from "@nfl-pool-monorepo/ui/components/button";
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
  useSidebar,
} from "@nfl-pool-monorepo/ui/components/sidebar";
import { WEEKS_IN_SEASON } from "@nfl-pool-monorepo/utils/constants";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import { usePathname, useRouter } from "next/navigation";
import { type FC, Fragment, startTransition, useCallback, useState } from "react";
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
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const progress = useProgressBar();
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState<boolean>(false);
  const [unregisterDialogOpen, setUnregisterDialogOpen] = useState<boolean>(false);
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

  const handleRegisterForSurvivor = async (): Promise<void> => {
    const result = await registerForSurvivor();

    processFormState(
      result,
      () => {
        router.refresh();
        setRegisterDialogOpen(false);
      },
      "You have successfully registered for survivor!",
    );
  };

  const handleUnregisterForSurvivor = async (): Promise<void> => {
    const result = await unregisterForSurvivor();

    processFormState(
      result,
      () => {
        router.refresh();
        setUnregisterDialogOpen(false);
      },
      "You have successfully dropped out of survivor!",
    );
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
                  {!(hasSeasonStarted || user.playsSurvivor) && (
                    <AlertDialog onOpenChange={setRegisterDialogOpen} open={registerDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <NavLink isNested>Register for Survivor</NavLink>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Register for Survivor Pool</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to register for the survivor pool? You will be required to pick one
                            team each week to win. If your team loses, you're eliminated from the pool.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleRegisterForSurvivor}>Register</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  {!hasSeasonStarted && !!user.playsSurvivor && (
                    <AlertDialog onOpenChange={setUnregisterDialogOpen} open={unregisterDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <NavLink isNested>Drop out of Survivor</NavLink>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Drop out of Survivor Pool</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to drop out of the survivor pool? This action cannot be undone, and
                            you will not be able to rejoin once the season has started.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className={cn(buttonVariants({ variant: "destructive" }))}
                            onClick={handleUnregisterForSurvivor}
                          >
                            Drop Out
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
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
                    <ProgressBarLink
                      href="/users/edit"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setOpenMobile(false);
                      }}
                    >
                      Edit Account
                    </ProgressBarLink>
                  </DropdownMenuItem>
                )}
                {user.doneRegistering === 1 && (
                  <DropdownMenuItem>
                    <ProgressBarLink
                      href="/users/payments"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setOpenMobile(false);
                      }}
                    >
                      View Payments
                    </ProgressBarLink>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <ProgressBarLink
                    href="/auth/logout"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setOpenMobile(false);
                    }}
                  >
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
