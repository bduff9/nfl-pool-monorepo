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
import { buttonVariants } from "@nfl-pool-monorepo/ui/components/button-variants";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@nfl-pool-monorepo/ui/components/collapsible";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenuButton,
} from "@nfl-pool-monorepo/ui/components/sidebar";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { Route } from "next";
import type { FC, ReactNode } from "react";
import { LuChevronDown } from "react-icons/lu";

import type { getMyTiebreaker } from "@/server/loaders/tiebreaker";

import NavLink from "../NavLink/NavLink";
import {
  showAdminSection,
  showDropOutOfSurvivor,
  showHeadToHead,
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

type NavSectionProps = {
  children: ReactNode;
  currentPage: string;
  title: string;
};

const NavSection: FC<NavSectionProps> = ({ children, currentPage, title }) => (
  <Collapsible className="group/collapsible" defaultOpen={currentPage === title}>
    <SidebarGroup>
      <SidebarGroupLabel asChild className="text-2xl text-sidebar-foreground">
        <CollapsibleTrigger>
          {title}
          <LuChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
        </CollapsibleTrigger>
      </SidebarGroupLabel>
      <CollapsibleContent>
        <SidebarGroupContent>{children}</SidebarGroupContent>
      </CollapsibleContent>
    </SidebarGroup>
  </Collapsible>
);

const RegistrationNavigation: FC = () => (
  <SidebarContent>
    <SidebarMenuButton asChild>
      <NavLink href="/users/create">Finish Registration</NavLink>
    </SidebarMenuButton>

    <SidebarMenuButton asChild>
      <NavLink href="/support">Help</NavLink>
    </SidebarMenuButton>
  </SidebarContent>
);

type DashboardSectionProps = {
  currentPage: string;
  overallMvCount: number;
  weeklyMvCount: number;
};

const DashboardSection: FC<DashboardSectionProps> = ({ currentPage, overallMvCount, weeklyMvCount }) => (
  <NavSection currentPage={currentPage} title="Dashboard">
    <NavLink href="/" isNested>
      My Dashboard
    </NavLink>
    <NavLink href="/weekly" isNested show={showWeekResults(weeklyMvCount)}>
      Week Results
    </NavLink>
    <NavLink href="/overall" isNested show={showOverallResults(overallMvCount)}>
      Overall Results
    </NavLink>
    <NavLink href="/history" isNested>
      Pool History
    </NavLink>
    <NavLink href={"/head-to-head" as Route} isNested show={showHeadToHead(weeklyMvCount)}>
      Head-to-Head
    </NavLink>
  </NavSection>
);

type PicksSectionProps = {
  currentPage: string;
  myTiebreaker: SidebarNavigationProps["myTiebreaker"];
  weeklyMvCount: number;
};

const PicksSection: FC<PicksSectionProps> = ({ currentPage, myTiebreaker, weeklyMvCount }) => (
  <NavSection currentPage={currentPage} title="Picks">
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
  </NavSection>
);

type SurvivorConfirmDialogProps = {
  actionClassName?: string;
  actionLabel: string;
  children: ReactNode;
  dialog: SurvivorDialogState;
  title: string;
  triggerLabel: string;
};

const SurvivorConfirmDialog: FC<SurvivorConfirmDialogProps> = ({
  actionClassName,
  actionLabel,
  children,
  dialog,
  title,
  triggerLabel,
}) => (
  <AlertDialog onOpenChange={dialog.setOpen} open={dialog.open}>
    <AlertDialogTrigger asChild>
      <NavLink isNested>{triggerLabel}</NavLink>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{children}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction className={actionClassName} disabled={dialog.isPending} onClick={dialog.onConfirm}>
          {actionLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

const RegisterSurvivorDialog: FC<{ dialog: SurvivorDialogState }> = ({ dialog }) => (
  <SurvivorConfirmDialog
    actionLabel="Register"
    dialog={dialog}
    title="Register for Survivor Pool"
    triggerLabel="Register for Survivor"
  >
    Are you sure you want to register for the survivor pool? You will be required to pick one team each week to win. If
    your team loses, you're eliminated from the pool.
  </SurvivorConfirmDialog>
);

const DropOutSurvivorDialog: FC<{ dialog: SurvivorDialogState }> = ({ dialog }) => (
  <SurvivorConfirmDialog
    actionClassName={cn(buttonVariants({ variant: "destructive" }))}
    actionLabel="Drop Out"
    dialog={dialog}
    title="Drop out of Survivor Pool"
    triggerLabel="Drop out of Survivor"
  >
    Are you sure you want to drop out of the survivor pool? This action cannot be undone, and you will not be able to
    rejoin once the season has started.
  </SurvivorConfirmDialog>
);

type SurvivorSectionProps = Pick<
  SidebarNavigationProps,
  | "currentPage"
  | "hasSeasonStarted"
  | "isAliveInSurvivor"
  | "registerDialog"
  | "selectedWeekStatus"
  | "survivorMvCount"
  | "unregisterDialog"
  | "user"
>;

const SurvivorSection: FC<SurvivorSectionProps> = ({
  currentPage,
  hasSeasonStarted,
  isAliveInSurvivor,
  registerDialog,
  selectedWeekStatus,
  survivorMvCount,
  unregisterDialog,
  user,
}) => (
  <NavSection currentPage={currentPage} title="Survivor">
    {showRegisterForSurvivor(hasSeasonStarted, user) && <RegisterSurvivorDialog dialog={registerDialog} />}
    {showDropOutOfSurvivor(hasSeasonStarted, user) && <DropOutSurvivorDialog dialog={unregisterDialog} />}
    <NavLink href="/survivor/set" isNested show={showMakeSurvivorPick(user, isAliveInSurvivor, selectedWeekStatus)}>
      Make Picks
    </NavLink>
    <NavLink href="/survivor/view" isNested show={showViewSurvivorPicks(survivorMvCount)}>
      View Picks
    </NavLink>
  </NavSection>
);

const AdminSection: FC<{ currentPage: string }> = ({ currentPage }) => (
  <NavSection currentPage={currentPage} title="Admin">
    <NavLink href="/admin/api" isNested>
      API Logs
    </NavLink>
    <NavLink href="/admin/backups" isNested>
      Backups
    </NavLink>
    <NavLink href="/admin/email" isNested>
      Emails
    </NavLink>
    <NavLink href={"/admin/games" as Route} isNested>
      Games
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
  </NavSection>
);

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
    return <RegistrationNavigation />;
  }

  return (
    <SidebarContent>
      <DashboardSection currentPage={currentPage} overallMvCount={overallMvCount} weeklyMvCount={weeklyMvCount} />
      <PicksSection currentPage={currentPage} myTiebreaker={myTiebreaker} weeklyMvCount={weeklyMvCount} />
      <SurvivorSection
        currentPage={currentPage}
        hasSeasonStarted={hasSeasonStarted}
        isAliveInSurvivor={isAliveInSurvivor}
        registerDialog={registerDialog}
        selectedWeekStatus={selectedWeekStatus}
        survivorMvCount={survivorMvCount}
        unregisterDialog={unregisterDialog}
        user={user}
      />

      <SidebarMenuButton asChild>
        <NavLink href="/scoreboard" includeSubpages show={showScoreboard(user)}>
          NFL Scoreboard
        </NavLink>
      </SidebarMenuButton>

      <SidebarMenuButton asChild>
        <NavLink href="/support">Help</NavLink>
      </SidebarMenuButton>

      {showAdminSection(user) && <AdminSection currentPage={currentPage} />}
    </SidebarContent>
  );
};
