"use client";

import type { User } from "@nfl-pool-monorepo/types";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { FC, ReactNode } from "react";

import { UseBeforeUnloadProvider } from "@/lib/hooks/useBeforeUnload";
import { useLogrocket } from "@/lib/hooks/useLogRocket";

import { ProgressBar } from "../ProgressBar/ProgressBar";

type Props = {
  children: ReactNode;
  user?: User | null;
};

const Providers: FC<Props> = ({ children, user }) => {
  useLogrocket(user);

  return (
    <UseBeforeUnloadProvider>
      <ProgressBar className="fixed top-0 bg-sky-600 h-2 z-1031">
        <NuqsAdapter>{children}</NuqsAdapter>
      </ProgressBar>
    </UseBeforeUnloadProvider>
  );
};

export default Providers;
