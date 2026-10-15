"use client";
import "client-only";

import Image from "next/image";
import { unstable_rethrow } from "next/navigation";
import { addTransitionType, type FC, startTransition, useEffect, useState } from "react";

import { WeekLink } from "@/components/WeekLink/WeekLink";
import { forgetHandoffs } from "@/lib/forgetHandoffs";
import { clearOfflineCaches } from "@/lib/serviceWorker";
import { signOut } from "@/server/actions/sessions";

// signOut ends with a redirect to /auth/login, and a Server Action redirect can't carry a transition type. Calling the
// action inside a transition that has the type gives it one: the router dispatches the action in a nested transition,
// which inherits the type, and the redirect commits in it.
const signOutWithFade = (): Promise<void> => {
  let pending: Promise<void> = Promise.resolve();

  startTransition(() => {
    addTransitionType("nav-fade");
    pending = signOut();
  });

  return pending;
};

const LogoutClient: FC = () => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const handleSignOut = async (): Promise<void> => {
      window.sessionStorage.clear();
      window.localStorage.clear();
      forgetHandoffs();

      try {
        await clearOfflineCaches();
        await signOutWithFade();
      } catch (error) {
        unstable_rethrow(error);
        console.error("Failed to sign out", error);
        setFailed(true);
      }
    };

    handleSignOut();
  }, []);

  return (
    <div className="text-white text-6xl -translate-y-1/2 mt-[50%]">
      <Image
        alt="Spinning football loader"
        className="max-w-full mx-auto"
        height={200}
        src="/spinningfootball.gif"
        width={200}
      />
      {failed ? (
        <div className="mt-4 flex flex-col items-center gap-2">
          <div className="text-2xl">Something went wrong signing you out.</div>
          <WeekLink className="text-lg underline" href="/auth/login">
            Go to login
          </WeekLink>
        </div>
      ) : (
        <div className="mt-4">Logging out...</div>
      )}
    </div>
  );
};

export default LogoutClient;
