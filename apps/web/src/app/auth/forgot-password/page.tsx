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

import { Button } from "@nfl-pool-monorepo/ui/components/button";
import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import "server-only";

import { getSystemYear } from "@nfl-pool-monorepo/db/src/queries/systemValue";
import type { FC } from "react";

import ForgotPasswordForm from "@/components/ForgotPasswordForm/ForgotPasswordForm";
import { ProgressBarLink } from "@/components/ProgressBar/ProgressBar";
import { requireLoggedOut } from "@/lib/auth";

const TITLE = "Forgot Password";

export const metadata: Metadata = {
  title: TITLE,
};

const ForgotPassword: FC<PageProps<"/auth/forgot-password">> = async ({ searchParams }) => {
  const redirectUrl = await requireLoggedOut();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const { error } = await searchParams;
  const year = await getSystemYear();
  const errorMessage = Array.isArray(error) ? error[0] : error;

  return (
    <div className="bg-gray-100 text-gray-800 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-gray-800 rounded-lg p-4 shrink-0 grow w-full h-full lg:h-auto lg:w-[50%] xl:w-[33%]">
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 size-36">
        <Image
          alt="A football"
          className="object-contain object-center hidden lg:block"
          fill
          priority={true}
          sizes="144px"
          src="/football.svg"
        />
      </div>
      <h1 className="text-center font-medium text-4xl mt-8">
        {year}
        <br />
        NFL Confidence Pool
      </h1>
      <h2 className="text-center font-medium text-2xl mt-4 mb-6">Reset Password</h2>

      <ForgotPasswordForm error={errorMessage} />

      <div className="grid gap-2 mt-4">
        <Button asChild variant="black">
          <ProgressBarLink href="/auth/login">Back to Login</ProgressBarLink>
        </Button>
      </div>
    </div>
  );
};

// ts-prune-ignore-next
export default ForgotPassword;
