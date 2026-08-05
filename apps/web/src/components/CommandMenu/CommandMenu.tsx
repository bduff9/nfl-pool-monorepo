"use client";

import type { User } from "@nfl-pool-monorepo/types";
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
import { type FC, type ReactNode, startTransition, useCallback, useEffect, useState } from "react";
import { LuCalendarDays, LuLayoutDashboard, LuLifeBuoy, LuShield, LuTable, LuUserCog } from "react-icons/lu";

import { useProgressBar } from "../ProgressBar/ProgressBar";

type CommandMenuProps = {
  user: User;
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
  const handleSelect = useCallback(() => onNavigate(href), [href, onNavigate]);

  return <CommandItem onSelect={handleSelect}>{children}</CommandItem>;
};

export const CommandMenu: FC<CommandMenuProps> = ({ user }) => {
  const [open, setOpen] = useState<boolean>(false);
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

  const navigate = useCallback(
    (href: Route) => {
      setOpen(false);
      progress.start();

      startTransition(() => {
        router.push(href);
        progress.done();
      });
    },
    [progress, router],
  );

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
          <CommandNavItem href="/weekly" onNavigate={navigate}>
            <LuLayoutDashboard />
            Week Results
          </CommandNavItem>
          <CommandNavItem href="/overall" onNavigate={navigate}>
            <LuLayoutDashboard />
            Overall Results
          </CommandNavItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Picks">
          <CommandNavItem href="/picks/set" onNavigate={navigate}>
            <LuTable />
            Make Picks
          </CommandNavItem>
          <CommandNavItem href="/picks/view" onNavigate={navigate}>
            <LuTable />
            View My Picks
          </CommandNavItem>
          <CommandNavItem href="/picks/viewall" onNavigate={navigate}>
            <LuTable />
            View All Picks
          </CommandNavItem>
        </CommandGroup>
        {!!user.playsSurvivor && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Survivor">
              <CommandNavItem href="/survivor/set" onNavigate={navigate}>
                <LuShield />
                Make Survivor Pick
              </CommandNavItem>
              <CommandNavItem href="/survivor/view" onNavigate={navigate}>
                <LuShield />
                View Survivor Picks
              </CommandNavItem>
            </CommandGroup>
          </>
        )}
        <CommandSeparator />
        <CommandGroup heading="General">
          <CommandNavItem href="/scoreboard" onNavigate={navigate}>
            <LuCalendarDays />
            NFL Scoreboard
          </CommandNavItem>
          <CommandNavItem href="/support" onNavigate={navigate}>
            <LuLifeBuoy />
            Help
          </CommandNavItem>
          <CommandNavItem href="/users/edit" onNavigate={navigate}>
            <LuUserCog />
            Edit Account
          </CommandNavItem>
          <CommandNavItem href="/users/payments" onNavigate={navigate}>
            <LuUserCog />
            View Payments
          </CommandNavItem>
        </CommandGroup>
        {user.isAdmin === 1 && (
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
