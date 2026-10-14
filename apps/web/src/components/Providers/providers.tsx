"use client";

import { ThemeProvider } from "@nfl-pool-monorepo/ui/components/theme-provider";
import NextTopLoader from "nextjs-toploader";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { FC, ReactNode } from "react";

import { UseBeforeUnloadProvider } from "@/lib/hooks/useBeforeUnload";
import { useThemeHotkey } from "@/lib/hooks/useThemeHotkey";

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
      <UseBeforeUnloadProvider>
        <NextTopLoader color="#22c55e" height={4} shadow={false} showSpinner={false} zIndex={1031} />
        <NuqsAdapter>{children}</NuqsAdapter>
      </UseBeforeUnloadProvider>
    </ThemeProvider>
  );
};

export default Providers;
