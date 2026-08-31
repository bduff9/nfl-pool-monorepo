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
import { useProgressBar } from "../ProgressBar/ProgressBar";

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

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
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
  const progress = useProgressBar();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const isCommandK = event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);

      if (!isCommandK || isTypingTarget(event.target)) {
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
    progress.start();

    startTransition(() => {
      router.push(withWeek(href, week));
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
        <CommandGroup heading="Dashboard">
          <CommandNavItem href="/" onNavigate={navigate}>
            <LuLayoutDashboard />
            My Dashboard
          </CommandNavItem>
          {showWeekResults(weeklyMvCount) && (
            <CommandNavItem href="/weekly" onNavigate={navigate}>
              <LuLayoutDashboard />
              Week Results
            </CommandNavItem>
          )}
          {showOverallResults(overallMvCount) && (
            <CommandNavItem href="/overall" onNavigate={navigate}>
              <LuLayoutDashboard />
              Overall Results
            </CommandNavItem>
          )}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Picks">
          {showMakePicks(myTiebreaker?.TiebreakerHasSubmitted) && (
            <CommandNavItem href="/picks/set" onNavigate={navigate}>
              <LuTable />
              Make Picks
            </CommandNavItem>
          )}
          <CommandNavItem href="/picks/view" onNavigate={navigate}>
            <LuTable />
            View My Picks
          </CommandNavItem>
          {showViewAllPicks(weeklyMvCount, myTiebreaker?.TiebreakerHasSubmitted) && (
            <CommandNavItem href="/picks/viewall" onNavigate={navigate}>
              <LuTable />
              View All Picks
            </CommandNavItem>
          )}
        </CommandGroup>
        {!!user.playsSurvivor && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Survivor">
              {showMakeSurvivorPick(user, isAliveInSurvivor, selectedWeekStatus) && (
                <CommandNavItem href="/survivor/set" onNavigate={navigate}>
                  <LuShield />
                  Make Survivor Pick
                </CommandNavItem>
              )}
              {showViewSurvivorPicks(survivorMvCount) && (
                <CommandNavItem href="/survivor/view" onNavigate={navigate}>
                  <LuShield />
                  View Survivor Picks
                </CommandNavItem>
              )}
            </CommandGroup>
          </>
        )}
        <CommandSeparator />
        <CommandGroup heading="General">
          {showScoreboard(user) && (
            <CommandNavItem href="/scoreboard" onNavigate={navigate}>
              <LuCalendarDays />
              NFL Scoreboard
            </CommandNavItem>
          )}
          <CommandNavItem href="/support" onNavigate={navigate}>
            <LuLifeBuoy />
            Help
          </CommandNavItem>
          {showAccountLinks(user) && (
            <CommandNavItem href="/users/edit" onNavigate={navigate}>
              <LuUserCog />
              Edit Account
            </CommandNavItem>
          )}
          {showAccountLinks(user) && (
            <CommandNavItem href="/users/payments" onNavigate={navigate}>
              <LuUserCog />
              View Payments
            </CommandNavItem>
          )}
        </CommandGroup>
        {showAdminSection(user) && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Admin">
              <CommandNavItem href="/admin/users" onNavigate={navigate}>
                <LuShield />
                Users
              </CommandNavItem>
              <CommandNavItem href="/admin/payments" onNavigate={navigate}>
                <LuShield />
                Payments
              </CommandNavItem>
              <CommandNavItem href="/admin/logs" onNavigate={navigate}>
                <LuShield />
                Logs
              </CommandNavItem>
              <CommandNavItem href="/admin/email" onNavigate={navigate}>
                <LuShield />
                Emails
              </CommandNavItem>
              <CommandNavItem href="/admin/api" onNavigate={navigate}>
                <LuShield />
                API Logs
              </CommandNavItem>
              <CommandNavItem href="/admin/backups" onNavigate={navigate}>
                <LuShield />
                Backups
              </CommandNavItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};
