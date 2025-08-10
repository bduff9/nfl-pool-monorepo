"use client";

import type { User } from "@nfl-pool-monorepo/types";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { FC, ReactNode } from "react";
import { useState } from "react";

import { TitleContext } from "@/lib/context";
import { useLogrocket } from "@/lib/hooks/useLogRocket";

import { ProgressBar } from "../ProgressBar/ProgressBar";

type Props = {
  children: ReactNode;
  user?: User | null;
};

const Providers: FC<Props> = ({ children, user }) => {
  const titleContext = useState<string>("Welcome");
  useLogrocket(user);

  return (
    <ProgressBar className="fixed top-0 bg-sky-600 h-2 z-1031">
      <TitleContext.Provider value={titleContext}>
        <NuqsAdapter>{children}</NuqsAdapter>
      </TitleContext.Provider>
    </ProgressBar>
  );
};

export default Providers;
