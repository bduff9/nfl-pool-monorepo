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

import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import type { FC } from "react";

import { ProgressBarLink } from "../ProgressBar/ProgressBar";

type NavLinkProps = {
  children: string;
  href?: Route;
  isNested?: boolean;
  onClick?: () => void;
  show?: boolean;
};

const NavLink: FC<NavLinkProps> = ({ children, href, isNested = false, onClick, show = true }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  if (!show) {
    return null;
  }

  if (href) {
    return (
      <ProgressBarLink
        className={cn(
          "inline-block w-full py-2 rounded text-2xl font-medium",
          isActive && "text-green-700 bg-gray-200",
          isNested ? "ps-8 text-lg font-normal" : "ps-4",
        )}
        href={href}
      >
        {children}
      </ProgressBarLink>
    );
  }

  return (
    <button
      className={cn(
        "text-left w-full py-2 rounded cursor-pointer",
        isActive && "text-green-700 bg-gray-200",
        isNested ? "ps-8 text-lg font-normal" : "ps-4",
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
};

export default NavLink;
