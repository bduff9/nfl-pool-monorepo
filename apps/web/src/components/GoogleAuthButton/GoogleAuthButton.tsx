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
import { type FC, useTransition } from "react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";

import { getGoogleAuthorizationUrl } from "@/server/actions/googleAuth";

import { getGoogleButtonTitle } from "./googleButtonTitle";

type GoogleAuthButtonProps = {
  isLinked?: boolean;
  isRegister?: boolean;
  isSignIn?: boolean;
};

const GoogleAuthButton: FC<GoogleAuthButtonProps> = ({ isLinked, isRegister, isSignIn }) => {
  const [isLoading, startTransition] = useTransition();
  const title = getGoogleButtonTitle({ isLinked, isRegister, isSignIn });
  const label = isLoading ? "Redirecting..." : title;

  const handleClick = (): void => {
    startTransition(async () => {
      try {
        const url = await getGoogleAuthorizationUrl();

        window.location.href = url;
      } catch (error) {
        console.error("Failed to start Google sign-in", error);
        toast.error("Couldn't start Google sign-in", { description: "Please try again." });
      }
    });
  };

  return (
    <button
      aria-label={title}
      className={cn(
        "flex min-h-11 items-center gap-3 bg-google-button-blue rounded-full p-0.5 pr-4 transition-colors duration-300 hover:bg-google-button-blue-hover disabled:opacity-65",
        isLinked && "pointer-events-none",
      )}
      disabled={isLoading || isLinked}
      onClick={handleClick}
      type="button"
    >
      <div className="flex items-center justify-center bg-white w-9 h-9 rounded-full">
        <FcGoogle className="size-5" />
      </div>
      <span className="text-sm text-white tracking-wider">{label}</span>
    </button>
  );
};

export default GoogleAuthButton;
