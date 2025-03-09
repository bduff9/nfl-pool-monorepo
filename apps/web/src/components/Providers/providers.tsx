"use client";

import type { FC, ReactNode } from "react";
import { useState } from "react";
import { SkeletonTheme } from "react-loading-skeleton";

import { ProgressBar } from "../ProgressBar/ProgressBar";

import { TitleContext } from "@/lib/context";

type Props = {
  children: ReactNode;
};

const Providers: FC<Props> = ({ children }) => {
  const titleContext = useState<string>("Welcome");

  return (
    <ProgressBar className="fixed top-0 bg-sky-600 h-2 z-1031">
      <TitleContext.Provider value={titleContext}>
        <SkeletonTheme baseColor="#F2F2F2" highlightColor="#444">
          {children}
        </SkeletonTheme>
      </TitleContext.Provider>
    </ProgressBar>
  );
};

export default Providers;
