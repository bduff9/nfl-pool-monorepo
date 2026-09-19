"use client";

import type { User } from "@nfl-pool-monorepo/types";
import { Button } from "@nfl-pool-monorepo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@nfl-pool-monorepo/ui/components/dropdown-menu";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@nfl-pool-monorepo/ui/components/sidebar";
import { WEEKS_IN_SEASON } from "@nfl-pool-monorepo/utils/constants";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { Route } from "next";
import { type FC, Fragment, type ReactNode } from "react";
import { LuChevronDown, LuChevronLeft, LuChevronRight, LuReply } from "react-icons/lu";

import { withWeek } from "@/lib/weekSearchParams";

import { ProgressBarLink } from "../ProgressBar/ProgressBar";

// usePathname() always returns the current, already-valid route, so this is a safe escape hatch
// for typedRoutes' branded `Route` type.
const asRoute = (pathname: string): Route => pathname as Route;

type WeekStepButtonProps = {
  ariaLabel: string;
  href: Route;
  icon: ReactNode;
  onClick: () => void;
  transitionType: "nav-back" | "nav-forward";
};

const WeekStepButton: FC<WeekStepButtonProps> = ({ ariaLabel, href, icon, onClick, transitionType }) => (
  <Button asChild className="p-0 m-0 [&_svg]:size-6" size="icon" variant="ghost">
    <ProgressBarLink
      aria-label={ariaLabel}
      href={href}
      onClick={onClick}
      prefetch={true}
      transitionTypes={[transitionType]}
    >
      {icon}
    </ProgressBarLink>
  </Button>
);

type WeekMenuItemProps = {
  currentWeek: number;
  href: Route;
  onSelectWeek: (week: number) => void;
  selectedWeek: number;
  week: number;
};

// fallow-ignore-next-line complexity -- moved unchanged out of the formerly-CRITICAL AppSidebarClient; not further reducible
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

type SidebarWeekHeaderProps = {
  currentWeek: number;
  onSelectWeek: (week: number) => void;
  pathname: string;
  selectedWeek: number;
  user: User;
};

// fallow-ignore-next-line complexity -- single-responsibility piece extracted from the formerly-CRITICAL AppSidebarClient; not further reducible
export const SidebarWeekHeader: FC<SidebarWeekHeaderProps> = ({
  currentWeek,
  onSelectWeek,
  pathname,
  selectedWeek,
  user,
}) => {
  const handlePreviousWeek = () => {
    onSelectWeek(selectedWeek - 1);
  };

  const handleNextWeek = () => {
    onSelectWeek(selectedWeek + 1);
  };

  const handleGoToCurrentWeek = () => {
    onSelectWeek(currentWeek);
  };

  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem className={cn("flex justify-between", user.doneRegistering !== 1 && "invisible")}>
          {selectedWeek > 1 ? (
            <WeekStepButton
              ariaLabel="Previous week"
              href={withWeek(asRoute(pathname), selectedWeek - 1)}
              icon={<LuChevronLeft />}
              onClick={handlePreviousWeek}
              transitionType="nav-back"
            />
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
                  onSelectWeek={onSelectWeek}
                  selectedWeek={selectedWeek}
                  week={week}
                />
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {selectedWeek < WEEKS_IN_SEASON ? (
            <WeekStepButton
              ariaLabel="Next week"
              href={withWeek(asRoute(pathname), selectedWeek + 1)}
              icon={<LuChevronRight />}
              onClick={handleNextWeek}
              transitionType="nav-forward"
            />
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
  );
};
