"use client";

import type { Status, User } from "@nfl-pool-monorepo/types";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@nfl-pool-monorepo/ui/components/command";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useTopLoader } from "nextjs-toploader";
import { useQueryState } from "nuqs";
import { type FC, type ReactNode, startTransition, useEffect, useState } from "react";
import { LuCalendarDays, LuLayoutDashboard, LuLifeBuoy, LuShield, LuTable, LuUserCog } from "react-icons/lu";

import { weekParser } from "@/lib/weekParser";
import { withWeek } from "@/lib/weekSearchParams";
import type { getMyTiebreaker } from "@/server/loaders/tiebreaker";

import {
  showAccountLinks,
  showAdminSection,
  showMakePicks,
  showMakeSurvivorPick,
  showOverallResults,
  showScoreboard,
  showViewAllPicks,
  showViewSurvivorPicks,
  showWeekResults,
} from "../AppSidebar/navVisibility";
import { isCommandKShortcut, isTypingElement } from "./commandMenuKeys";

type CommandMenuClientProps = {
  isAliveInSurvivor: boolean;
  myTiebreaker: Awaited<ReturnType<typeof getMyTiebreaker>>;
  overallMvCount: number;
  selectedWeekStatus: Status;
  survivorMvCount: number;
  user: User;
  weeklyMvCount: number;
};

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return isTypingElement(target.tagName, target.isContentEditable);
};

type CommandNavItemProps = {
  children: ReactNode;
  href: Route;
  onNavigate: (href: Route) => void;
};

const CommandNavItem: FC<CommandNavItemProps> = ({ children, href, onNavigate }) => {
  const handleSelect = () => onNavigate(href);

  return <CommandItem onSelect={handleSelect}>{children}</CommandItem>;
};

type GroupProps = {
  onNavigate: (href: Route) => void;
};

type MenuGroupProps = GroupProps & {
  user: User;
};

const DashboardGroup: FC<GroupProps & { overallMvCount: number; weeklyMvCount: number }> = ({
  onNavigate,
  overallMvCount,
  weeklyMvCount,
}) => (
  <CommandGroup heading="Dashboard">
    <CommandNavItem href="/" onNavigate={onNavigate}>
      <LuLayoutDashboard />
      My Dashboard
    </CommandNavItem>
    {showWeekResults(weeklyMvCount) && (
      <CommandNavItem href="/weekly" onNavigate={onNavigate}>
        <LuLayoutDashboard />
        Week Results
      </CommandNavItem>
    )}
    {showOverallResults(overallMvCount) && (
      <CommandNavItem href="/overall" onNavigate={onNavigate}>
        <LuLayoutDashboard />
        Overall Results
      </CommandNavItem>
    )}
  </CommandGroup>
);

const PicksGroup: FC<GroupProps & Pick<CommandMenuClientProps, "myTiebreaker" | "weeklyMvCount">> = ({
  myTiebreaker,
  onNavigate,
  weeklyMvCount,
}) => {
  const hasSubmitted = myTiebreaker?.TiebreakerHasSubmitted;

  return (
    <CommandGroup heading="Picks">
      {showMakePicks(hasSubmitted) && (
        <CommandNavItem href="/picks/set" onNavigate={onNavigate}>
          <LuTable />
          Make Picks
        </CommandNavItem>
      )}
      <CommandNavItem href="/picks/view" onNavigate={onNavigate}>
        <LuTable />
        View My Picks
      </CommandNavItem>
      {showViewAllPicks(weeklyMvCount, hasSubmitted) && (
        <CommandNavItem href="/picks/viewall" onNavigate={onNavigate}>
          <LuTable />
          View All Picks
        </CommandNavItem>
      )}
    </CommandGroup>
  );
};

const SurvivorGroup: FC<
  MenuGroupProps & Pick<CommandMenuClientProps, "isAliveInSurvivor" | "selectedWeekStatus" | "survivorMvCount">
> = ({ isAliveInSurvivor, onNavigate, selectedWeekStatus, survivorMvCount, user }) => {
  if (!user.playsSurvivor) {
    return null;
  }

  return (
    <>
      <CommandSeparator />
      <CommandGroup heading="Survivor">
        {showMakeSurvivorPick(user, isAliveInSurvivor, selectedWeekStatus) && (
          <CommandNavItem href="/survivor/set" onNavigate={onNavigate}>
            <LuShield />
            Make Survivor Pick
          </CommandNavItem>
        )}
        {showViewSurvivorPicks(survivorMvCount) && (
          <CommandNavItem href="/survivor/view" onNavigate={onNavigate}>
            <LuShield />
            View Survivor Picks
          </CommandNavItem>
        )}
      </CommandGroup>
    </>
  );
};

const GeneralGroup: FC<MenuGroupProps> = ({ onNavigate, user }) => (
  <CommandGroup heading="General">
    {showScoreboard(user) && (
      <CommandNavItem href="/scoreboard" onNavigate={onNavigate}>
        <LuCalendarDays />
        NFL Scoreboard
      </CommandNavItem>
    )}
    <CommandNavItem href="/support" onNavigate={onNavigate}>
      <LuLifeBuoy />
      Help
    </CommandNavItem>
    {showAccountLinks(user) && (
      <CommandNavItem href="/users/edit" onNavigate={onNavigate}>
        <LuUserCog />
        Edit Account
      </CommandNavItem>
    )}
    {showAccountLinks(user) && (
      <CommandNavItem href="/users/payments" onNavigate={onNavigate}>
        <LuUserCog />
        View Payments
      </CommandNavItem>
    )}
  </CommandGroup>
);

const AdminGroup: FC<MenuGroupProps> = ({ onNavigate, user }) => {
  if (!showAdminSection(user)) {
    return null;
  }

  return (
    <>
      <CommandSeparator />
      <CommandGroup heading="Admin">
        <CommandNavItem href="/admin/users" onNavigate={onNavigate}>
          <LuShield />
          Users
        </CommandNavItem>
        <CommandNavItem href="/admin/payments" onNavigate={onNavigate}>
          <LuShield />
          Payments
        </CommandNavItem>
        <CommandNavItem href="/admin/logs" onNavigate={onNavigate}>
          <LuShield />
          Logs
        </CommandNavItem>
        <CommandNavItem href="/admin/email" onNavigate={onNavigate}>
          <LuShield />
          Emails
        </CommandNavItem>
        <CommandNavItem href="/admin/api" onNavigate={onNavigate}>
          <LuShield />
          API Logs
        </CommandNavItem>
        <CommandNavItem href="/admin/backups" onNavigate={onNavigate}>
          <LuShield />
          Backups
        </CommandNavItem>
      </CommandGroup>
    </>
  );
};

export const CommandMenuClient: FC<CommandMenuClientProps> = ({
  isAliveInSurvivor,
  myTiebreaker,
  overallMvCount,
  selectedWeekStatus,
  survivorMvCount,
  user,
  weeklyMvCount,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [week] = useQueryState("week", weekParser);
  const router = useRouter();
  const topLoader = useTopLoader();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (!isCommandKShortcut(event.key, event.metaKey, event.ctrlKey) || isTypingTarget(event.target)) {
        return;
      }

      event.preventDefault();
      setOpen((isOpen) => !isOpen);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navigate = (href: Route) => {
    setOpen(false);
    topLoader.start();

    startTransition(() => {
      router.push(withWeek(href, week), { transitionTypes: ["nav-fade"] });
    });
  };

  if (user.doneRegistering !== 1) {
    return (
      <CommandDialog onOpenChange={setOpen} open={open}>
        <CommandInput placeholder="Search for a page..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="General">
            <CommandNavItem href="/users/create" onNavigate={navigate}>
              <LuUserCog />
              Finish Registration
            </CommandNavItem>
            <CommandNavItem href="/support" onNavigate={navigate}>
              <LuLifeBuoy />
              Help
            </CommandNavItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    );
  }

  return (
    <CommandDialog onOpenChange={setOpen} open={open}>
      <CommandInput placeholder="Search for a page..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <DashboardGroup onNavigate={navigate} overallMvCount={overallMvCount} weeklyMvCount={weeklyMvCount} />
        <CommandSeparator />
        <PicksGroup myTiebreaker={myTiebreaker} onNavigate={navigate} weeklyMvCount={weeklyMvCount} />
        <SurvivorGroup
          isAliveInSurvivor={isAliveInSurvivor}
          onNavigate={navigate}
          selectedWeekStatus={selectedWeekStatus}
          survivorMvCount={survivorMvCount}
          user={user}
        />
        <CommandSeparator />
        <GeneralGroup onNavigate={navigate} user={user} />
        <AdminGroup onNavigate={navigate} user={user} />
      </CommandList>
    </CommandDialog>
  );
};
