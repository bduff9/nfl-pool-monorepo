"use client";

import { ThemeProvider } from "@nfl-pool-monorepo/ui/components/theme-provider";
import { domAnimation, LazyMotion, MotionConfig } from "framer-motion";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { FC, ReactNode } from "react";

import { UseBeforeUnloadProvider } from "@/lib/hooks/useBeforeUnload";
import { useThemeHotkey } from "@/lib/hooks/useThemeHotkey";

import { ProgressBar } from "../ProgressBar/ProgressBar";

type Props = {
  children: ReactNode;
};

const ThemeHotkey: FC = () => {
  useThemeHotkey();

  return null;
};

const Providers: FC<Props> = ({ children }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange enableSystem>
      <ThemeHotkey />
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <UseBeforeUnloadProvider>
            <ProgressBar className="fixed top-0 bg-sky-600 h-2 z-1031">
              <NuqsAdapter>{children}</NuqsAdapter>
            </ProgressBar>
          </UseBeforeUnloadProvider>
        </MotionConfig>
      </LazyMotion>
    </ThemeProvider>
  );
};

export default Providers;
