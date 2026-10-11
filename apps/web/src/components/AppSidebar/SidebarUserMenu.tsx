"use client";

import type { User } from "@nfl-pool-monorepo/types";
import { Avatar, AvatarFallback, AvatarImage } from "@nfl-pool-monorepo/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@nfl-pool-monorepo/ui/components/dropdown-menu";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@nfl-pool-monorepo/ui/components/sidebar";
import { useTheme } from "next-themes";
import { type FC, useState } from "react";
import { LuEllipsisVertical, LuMoon, LuSun } from "react-icons/lu";

import { WeekLink } from "../WeekLink/WeekLink";
import { showAccountLinks } from "./navVisibility";

const getInitials = (fullName: string | null): string => {
  if (!fullName) return "";

  const names = fullName.split(" ");
  const initials = names.map((name) => name[0]?.toUpperCase()).join("");

  return initials;
};

type SidebarUserMenuProps = {
  isMobile: boolean;
  onNavigate: () => void;
  user: User;
};

// fallow-ignore-next-line complexity -- single-responsibility piece extracted from the formerly-CRITICAL AppSidebarClient; not further reducible
export const SidebarUserMenu: FC<SidebarUserMenuProps> = ({ isMobile, onNavigate, user }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);

  const handleLinkClick = () => {
    setUserMenuOpen(false);
    onNavigate();
  };

  const handleThemeToggleClick = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
    setUserMenuOpen(false);
  };

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu onOpenChange={setUserMenuOpen} open={userMenuOpen}>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton>
                <Avatar className="size-10 rounded-lg">
                  <AvatarImage src={user.image ?? undefined} />
                  <AvatarFallback className="size-full text-foreground rounded-lg">
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
            <DropdownMenuContent align="end" side={isMobile ? "bottom" : "right"}>
              {showAccountLinks(user) && (
                <DropdownMenuItem>
                  <WeekLink href="/users/edit" onClick={handleLinkClick}>
                    Edit Account
                  </WeekLink>
                </DropdownMenuItem>
              )}
              {showAccountLinks(user) && (
                <DropdownMenuItem>
                  <WeekLink href="/users/payments" onClick={handleLinkClick}>
                    View Payments
                  </WeekLink>
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
                <WeekLink href="/auth/logout" onClick={handleLinkClick}>
                  Sign out
                </WeekLink>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
};
