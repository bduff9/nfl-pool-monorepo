"use client";

/*******************************************************************************
 * NFL Confidence Pool FE - the frontend implementation of an NFL confidence pool.
 * Copyright (C) 2015-present Brian Duffey
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see {http://www.gnu.org/licenses/}.
 * Home: https://asitewithnoname.com/
 */

import { useSidebar } from "@nfl-pool-monorepo/ui/components/sidebar";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import type { FC } from "react";

import { WeekLink } from "../WeekLink/WeekLink";
import { getNavLinkClassName, isNavLinkActive } from "./navLinkClassName";

type NavLinkProps = {
  children: string;
  href?: Route;
  /** Also show as active on pages under `href`. */
  includeSubpages?: boolean;
  isNested?: boolean;
  onClick?: () => void;
  show?: boolean;
};

const NavLink: FC<NavLinkProps> = ({
  children,
  href,
  includeSubpages = false,
  isNested = false,
  onClick,
  show = true,
}) => {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const isActive = isNavLinkActive(pathname, href, includeSubpages);

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  if (!show) {
    return null;
  }

  if (href) {
    return (
      <WeekLink
        className={getNavLinkClassName("inline-block w-full py-2 rounded text-2xl font-medium", isActive, isNested)}
        data-pressable
        href={href}
        onClick={handleLinkClick}
        prefetch={true}
        transitionTypes={["nav-fade"]}
      >
        {children}
      </WeekLink>
    );
  }

  return (
    <button
      className={getNavLinkClassName("text-left w-full py-2 rounded cursor-pointer", isActive, isNested)}
      data-pressable
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
};

export default NavLink;
