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
import { buttonVariants } from "@nfl-pool-monorepo/ui/components/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@nfl-pool-monorepo/ui/components/collapsible";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenuButton,
} from "@nfl-pool-monorepo/ui/components/sidebar";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC } from "react";
import { LuChevronDown } from "react-icons/lu";

import type { getMyTiebreaker } from "@/server/loaders/tiebreaker";

import NavLink from "../NavLink/NavLink";
import {
  showAdminSection,
  showDropOutOfSurvivor,
  showMakePicks,
  showMakeSurvivorPick,
  showOverallResults,
  showRegisterForSurvivor,
  showScoreboard,
  showViewAllPicks,
  showViewSurvivorPicks,
  showWeekResults,
} from "./navVisibility";

type SurvivorDialogState = {
  isPending: boolean;
  onConfirm: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
};

type SidebarNavigationProps = {
  currentPage: string;
  hasSeasonStarted: boolean;
  isAliveInSurvivor: boolean;
  myTiebreaker: Awaited<ReturnType<typeof getMyTiebreaker>>;
  overallMvCount: number;
  registerDialog: SurvivorDialogState;
  selectedWeekStatus: Status;
  survivorMvCount: number;
  unregisterDialog: SurvivorDialogState;
  user: User;
  weeklyMvCount: number;
};

// react-doctor-disable-next-line no-many-boolean-props -- these are independent server-driven flags (season/survivor/pending state), not a combinatorial variant surface to design around
export const SidebarNavigation: FC<SidebarNavigationProps> = ({
  currentPage,
  hasSeasonStarted,
  isAliveInSurvivor,
  myTiebreaker,
  overallMvCount,
  registerDialog,
  selectedWeekStatus,
  survivorMvCount,
  unregisterDialog,
  user,
  weeklyMvCount,
}) => {
  if (user.doneRegistering !== 1) {
    return (
      <SidebarContent>
        <SidebarMenuButton asChild>
          <NavLink href="/users/create">Finish Registration</NavLink>
        </SidebarMenuButton>

        <SidebarMenuButton asChild>
          <NavLink href="/support">Help</NavLink>
        </SidebarMenuButton>
      </SidebarContent>
    );
  }

  return (
    <SidebarContent>
      <Collapsible className="group/collapsible" defaultOpen={currentPage === "Dashboard"}>
        <SidebarGroup>
          <SidebarGroupLabel asChild className="text-2xl text-sidebar-foreground">
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
              <NavLink href="/weekly" isNested show={showWeekResults(weeklyMvCount)}>
                Week Results
              </NavLink>
              <NavLink href="/overall" isNested show={showOverallResults(overallMvCount)}>
                Overall Results
              </NavLink>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>

      <Collapsible className="group/collapsible" defaultOpen={currentPage === "Picks"}>
        <SidebarGroup>
          <SidebarGroupLabel asChild className="text-2xl text-sidebar-foreground">
            <CollapsibleTrigger>
              Picks
              <LuChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <NavLink href="/picks/set" isNested show={showMakePicks(myTiebreaker?.TiebreakerHasSubmitted)}>
                Make Picks
              </NavLink>
              <NavLink href="/picks/view" isNested>
                View My Picks
              </NavLink>
              <NavLink
                href="/picks/viewall"
                isNested
                show={showViewAllPicks(weeklyMvCount, myTiebreaker?.TiebreakerHasSubmitted)}
              >
                View All Picks
              </NavLink>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>

      <Collapsible className="group/collapsible" defaultOpen={currentPage === "Survivor"}>
        <SidebarGroup>
          <SidebarGroupLabel asChild className="text-2xl text-sidebar-foreground">
            <CollapsibleTrigger>
              Survivor
              <LuChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              {showRegisterForSurvivor(hasSeasonStarted, user) && (
                <AlertDialog onOpenChange={registerDialog.setOpen} open={registerDialog.open}>
                  <AlertDialogTrigger asChild>
                    <NavLink isNested>Register for Survivor</NavLink>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Register for Survivor Pool</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to register for the survivor pool? You will be required to pick one team
                        each week to win. If your team loses, you're eliminated from the pool.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction disabled={registerDialog.isPending} onClick={registerDialog.onConfirm}>
                        Register
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {showDropOutOfSurvivor(hasSeasonStarted, user) && (
                <AlertDialog onOpenChange={unregisterDialog.setOpen} open={unregisterDialog.open}>
                  <AlertDialogTrigger asChild>
                    <NavLink isNested>Drop out of Survivor</NavLink>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Drop out of Survivor Pool</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to drop out of the survivor pool? This action cannot be undone, and you
                        will not be able to rejoin once the season has started.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className={cn(buttonVariants({ variant: "destructive" }))}
                        disabled={unregisterDialog.isPending}
                        onClick={unregisterDialog.onConfirm}
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
                show={showMakeSurvivorPick(user, isAliveInSurvivor, selectedWeekStatus)}
              >
                Make Picks
              </NavLink>
              <NavLink href="/survivor/view" isNested show={showViewSurvivorPicks(survivorMvCount)}>
                View Picks
              </NavLink>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>

      <SidebarMenuButton asChild>
        <NavLink href="/scoreboard" show={showScoreboard(user)}>
          NFL Scoreboard
        </NavLink>
      </SidebarMenuButton>

      <SidebarMenuButton asChild>
        <NavLink href="/support">Help</NavLink>
      </SidebarMenuButton>

      {showAdminSection(user) && (
        <Collapsible className="group/collapsible" defaultOpen={currentPage === "Admin"}>
          <SidebarGroup>
            <SidebarGroupLabel asChild className="text-2xl text-sidebar-foreground">
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
  );
};
