"use client";
import "client-only";
import Image from "next/image";
import { type FC, useEffect } from "react";

import { signOut } from "@/server/actions/sessions";

const LogoutClient: FC = () => {
  useEffect(() => {
    const handleSignOut = async (): Promise<void> => {
      window.sessionStorage.clear();
      window.localStorage.clear();

      await signOut();
    };

    handleSignOut();
  }, []);

  return (
    <h1 className="text-white text-6xl -translate-y-1/2 mt-[50%]">
      <Image
        alt="Spinning football loader"
        height={200}
        src="/spinningfootball.gif"
        width={200}
        className="max-w-full mx-auto"
      />
      <div className="mt-4">Logging out...</div>
    </h1>
  );
};

export default LogoutClient;
