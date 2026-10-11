"use client";
import "client-only";

import Image from "next/image";
import { unstable_rethrow } from "next/navigation";
import { type FC, useEffect, useState } from "react";

import { WeekLink } from "@/components/WeekLink/WeekLink";
import { clearOfflineCaches } from "@/lib/serviceWorker";
import { signOut } from "@/server/actions/sessions";

const LogoutClient: FC = () => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const handleSignOut = async (): Promise<void> => {
      window.sessionStorage.clear();
      window.localStorage.clear();

      try {
        await clearOfflineCaches();
        await signOut();
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
