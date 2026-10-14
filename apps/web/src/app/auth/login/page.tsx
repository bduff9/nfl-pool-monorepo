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
import { type FC, Suspense, ViewTransition } from "react";
import "server-only";

import { getSystemYear } from "@nfl-pool-monorepo/db/src/queries/systemValue";

import GoogleAuthButton from "@/components/GoogleAuthButton/GoogleAuthButton";
import LoginForm from "@/components/LoginForm/LoginForm";
import PasskeySignInButton from "@/components/PasskeySignInButton/PasskeySignInButton";
import TextSeparator from "@/components/TextSeparator/TextSeparator";
import PageTransition from "@/components/ViewTransitions/PageTransition";
import { WeekLink } from "@/components/WeekLink/WeekLink";
import { requireLoggedOut } from "@/lib/auth";

import AuthLoading from "../loading";
import { parseLoginSearchParams } from "./loginSearchParams";

const TITLE = "Login";

export const metadata: Metadata = {
  title: TITLE,
};

type LoginChoicesProps = {
  errorMessage: string | undefined;
  isLogin: boolean;
};

const QuickSignIn: FC<{ isLogin: boolean }> = ({ isLogin }) => (
  <div className="flex flex-col items-center gap-2 mb-2">
    {!!isLogin && <PasskeySignInButton />}
    <GoogleAuthButton isRegister={!isLogin} isSignIn />
  </div>
);

const LoginChoices: FC<LoginChoicesProps> = ({ errorMessage, isLogin }) => (
  <>
    <LoginForm error={errorMessage} isLogin={isLogin} />
    <QuickSignIn isLogin={isLogin} />
    <div className="grid gap-2">
      <TextSeparator>{isLogin ? "Need to sign up?" : "Already registered?"}</TextSeparator>
      <Button asChild variant="black">
        <WeekLink href={`/auth/login${isLogin ? "?register=Y" : ""}`} transitionTypes={["nav-fade"]}>
          {isLogin ? "Register here" : "Login here"}
        </WeekLink>
      </Button>
    </div>
  </>
);

type LoginContentProps = {
  searchParams: PageProps<"/auth/login">["searchParams"];
};

const LoginContent: FC<LoginContentProps> = async ({ searchParams }) => {
  const redirectUrl = await requireLoggedOut();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const [{ error, register, submitted }, year] = await Promise.all([searchParams, getSystemYear()]);

  const { errorMessage, hasSubmitted, isLogin } = parseLoginSearchParams({ error, register, submitted });

  // Login and register are the same page, so the toggle between them (typed nav-fade) crossfades the whole card in
  // place while it eases to its new height. An update rather than a keyed swap, so the form keeps what was typed.
  return (
    <ViewTransition default="none" update={{ default: "none", "nav-fade": "auto" }}>
      <div className="bg-muted text-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-border rounded-lg p-4 shrink-0 grow w-full h-full lg:h-auto lg:w-[50%] xl:w-[33%]">
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
        {hasSubmitted ? (
          <>
            <h2 className="text-center text-green-600 my-5">Please check your email to sign in</h2>
            <h3 className="text-center text-foreground mb-4">You may close this window</h3>
          </>
        ) : (
          <LoginChoices errorMessage={errorMessage} isLogin={isLogin} />
        )}
      </div>
    </ViewTransition>
  );
};

const Login: FC<PageProps<"/auth/login">> = ({ searchParams }) => {
  return (
    <PageTransition>
      <Suspense fallback={<AuthLoading />}>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </PageTransition>
  );
};

// ts-prune-ignore-next
export default Login;
