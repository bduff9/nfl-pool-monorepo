"use client";

import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { FC, ReactNode } from "react";
import { useState } from "react";

import { TitleContext } from "@/lib/context";

import { ProgressBar } from "../ProgressBar/ProgressBar";

type Props = {
  children: ReactNode;
};

const Providers: FC<Props> = ({ children }) => {
  const titleContext = useState<string>("Welcome");

  return (
    <ProgressBar className="fixed top-0 bg-sky-600 h-2 z-1031">
      <TitleContext.Provider value={titleContext}>
        <NuqsAdapter>
          {children}
        </NuqsAdapter>
      </TitleContext.Provider>
    </ProgressBar>
  );
};

export default Providers;
