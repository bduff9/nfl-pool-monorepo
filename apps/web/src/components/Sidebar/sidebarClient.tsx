"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@nfl-pool-monorepo/ui/components/accordion";
import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import { usePathname, useRouter } from "next/navigation";
import type { ChangeEvent, FC } from "react";
import { startTransition, useCallback, useContext, useEffect, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuMenu, LuReply, LuX } from "react-icons/lu";

import NavLink from "../NavLink/NavLink";
import { useProgressBar } from "../ProgressBar/ProgressBar";

import type { User } from "@/lib/auth";
import { WEEKS_IN_SEASON } from "@/lib/constants";
import { TitleContext } from "@/lib/context";
import type { Status } from "@/lib/types";
import { registerForSurvivor, unregisterForSurvivor } from "@/server/actions/survivor";
import { setSelectedWeek } from "@/server/actions/week";
import type { getMyTiebreaker } from "@/server/loaders/tiebreaker";

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

const SidebarClient: FC<Props> = ({
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
  const [openMenu, setOpenMenu] = useState<boolean>(false);
  const toggleMenu = useCallback((): void => {
    setOpenMenu(!openMenu);
  }, [openMenu]);
  const [title] = useContext(TitleContext);
  let currentPage = "";

  const updateWeek = (event: ChangeEvent<HTMLSelectElement>): void => {
    progress.start();

    startTransition(async () => {
      await setSelectedWeek(Number.parseInt(event.target.value, 10));
      router.refresh();
      progress.done();
    });
  };

  const goToPreviousWeek = (): void => {
    const newWeek = --selectedWeek;

    progress.start();

    startTransition(async () => {
      await setSelectedWeek(newWeek < 1 ? selectedWeek : newWeek);
      router.refresh();
      progress.done();
    });
  };

  const goToNextWeek = (): void => {
    const newWeek = ++selectedWeek;

    progress.start();

    startTransition(async () => {
      await setSelectedWeek(newWeek > WEEKS_IN_SEASON ? selectedWeek : newWeek);
      router.refresh();
      progress.done();
    });
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only need to re-run on currentWeek change
  const goToCurrentWeek = useCallback((): void => {
    if (currentWeek) {
      progress.start();

      startTransition(async () => {
        await setSelectedWeek(currentWeek);
        router.refresh();
        progress.done();
      });
    }
  }, [currentWeek]);

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: Need this to re-run every path change
  useEffect((): void => {
    setOpenMenu(false);
  }, [pathname]);

  return (
    <>
      <div className={cn("md:hidden print:hidden absolute text-center top-0 start-0 end-0 bg-black text-gray-100")}>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: Skipping a11y for now */}
        <span className={cn("absolute cursor-pointer top-[5px] left-[10px] text-gray-100 z-[1]")} onClick={toggleMenu}>
          <LuMenu className="size-6" />
        </span>
        <h1 className="m-0">{title}</h1>
      </div>
      <div
        className={cn(
          "fixed top-0 bottom-0 start-0 block pt-2 h-full w-[83.333333%] sm:w-[25%] lg:w-[16.666667%] md:block print:hidden z-[1030] overflow-x-hidden overflow-y-auto text-2xl font-bold text-gray-100 bg-black shadow-lg",
          !openMenu && "hidden",
        )}
      >
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: skipping a11y for now */}
        <span className="md:hidden" onClick={toggleMenu}>
          <LuX className="cursor-pointer absolute top-[5px] right-[10px]" />
        </span>
        {user.doneRegistering === 1 && (
          <>
            <div className={cn("text-center mb-4")}>Welcome, {user.firstName}</div>
            <div className={cn("text-center flex justify-around")}>
              <Button
                className={cn("p-0 m-0 [&_svg]:size-6", selectedWeek === 1 && "invisible")}
                onClick={goToPreviousWeek}
                size="icon"
                type="button"
                variant="ghost"
              >
                <LuChevronLeft />
              </Button>
              <select className="bg-inherit" onChange={updateWeek} value={selectedWeek.toString()}>
                {Array.from({ length: WEEKS_IN_SEASON }).map((_, i) => (
                  <option key={`week-${i + 1}`} value={(i + 1).toString()}>
                    Week {i + 1}
                  </option>
                ))}
              </select>
              <Button
                className={cn("p-0 m-0 [&_svg]:size-6", selectedWeek === WEEKS_IN_SEASON && "invisible")}
                onClick={goToNextWeek}
                size="icon"
                type="button"
                variant="ghost"
              >
                <LuChevronRight />
              </Button>
            </div>
            <div className={cn("text-center text-base h-9")}>
              {currentWeek !== selectedWeek && (
                <Button onClick={goToCurrentWeek} variant="ghost">
                  <LuReply />
                  &nbsp;Go to current week
                </Button>
              )}
            </div>
          </>
        )}
        <Accordion defaultValue={currentPage} type="single" collapsible>
          {!!user.doneRegistering && (
            <AccordionItem className="border-0" value="Dashboard">
              <AccordionTrigger className="text-2xl font-bold ps-2 hover:no-underline py-2">Dashboard</AccordionTrigger>
              <AccordionContent>
                <NavLink href="/" isNested>
                  My Dashboard
                </NavLink>
                <NavLink href="/weekly" isNested show={weeklyMvCount > 0}>
                  Week Results
                </NavLink>
                <NavLink href="/overall" isNested show={overallMvCount > 0}>
                  Overall Results
                </NavLink>
              </AccordionContent>
            </AccordionItem>
          )}
          {!!user.doneRegistering && (
            <AccordionItem className="border-0" value="Picks">
              <AccordionTrigger className="text-2xl font-bold ps-2 hover:no-underline py-2">Picks</AccordionTrigger>
              <AccordionContent>
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
              </AccordionContent>
            </AccordionItem>
          )}
          {!!user.doneRegistering && (
            <AccordionItem className="border-0" value="Survivor">
              <AccordionTrigger className="text-2xl font-bold ps-2 hover:no-underline py-2">Survivor</AccordionTrigger>
              <AccordionContent>
                <NavLink
                  isNested
                  onClick={async () => {
                    await registerForSurvivor();
                    router.refresh();
                  }}
                  show={!(hasSeasonStarted || user.playsSurvivor)}
                >
                  Register for Survivor
                </NavLink>
                <NavLink
                  isNested
                  onClick={async () => {
                    await unregisterForSurvivor();
                    router.refresh();
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
              </AccordionContent>
            </AccordionItem>
          )}
          <NavLink href="/scoreboard" show={!!user.doneRegistering}>
            NFL Scoreboard
          </NavLink>
          <AccordionItem className="border-0" value="My Account">
            <AccordionTrigger className="text-2xl font-bold ps-2 hover:no-underline py-2">My Account</AccordionTrigger>
            <AccordionContent>
              <NavLink href="/users/create" isNested show={!user.doneRegistering}>
                Finish Registration
              </NavLink>
              <NavLink href="/users/edit" isNested show={!!user.doneRegistering}>
                Edit My Profile
              </NavLink>
              <NavLink href="/users/payments" isNested show={!!user.doneRegistering}>
                View Payments
              </NavLink>
              {/* TODO: generate stats page
								<NavLink href="/users/stats" isNested show={user.doneRegistering}>
									Statistics
								</NavLink> */}
            </AccordionContent>
          </AccordionItem>
          <NavLink href="/support">Help</NavLink>
          {!!user.isAdmin && (
            <AccordionItem className="border-0" value="Admin">
              <AccordionTrigger className="text-2xl font-bold ps-2 hover:no-underline py-2">Admin</AccordionTrigger>
              <AccordionContent>
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
              </AccordionContent>
            </AccordionItem>
          )}
          <NavLink href="/auth/logout">Signout</NavLink>
        </Accordion>
      </div>
    </>
  );
};

export default SidebarClient;
