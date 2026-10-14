"use client";

import { ThemeProvider } from "@nfl-pool-monorepo/ui/components/theme-provider";
import { usePathname, useSearchParams } from "next/navigation";
import NextTopLoader from "nextjs-toploader";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { type FC, type ReactNode, Suspense } from "react";

import { UseBeforeUnloadProvider } from "@/lib/hooks/useBeforeUnload";
import { recordUrl } from "@/lib/hooks/useHasNavigated";
import { useThemeHotkey } from "@/lib/hooks/useThemeHotkey";

type Props = {
  children: ReactNode;
};

const ThemeHotkey: FC = () => {
  useThemeHotkey();

  return null;
};

// Rendered before the page, so useHasNavigated is already true in the first render of a page a client navigation mounts
const NavigationTracker: FC = () => {
  const url = `${usePathname()}?${useSearchParams().toString()}`;

  if (typeof window !== "undefined") {
    recordUrl(url);
  }

  return null;
};

const Providers: FC<Props> = ({ children }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange enableSystem>
      <ThemeHotkey />
      {/* Reads the search params, which are only known per request */}
      <Suspense fallback={null}>
        <NavigationTracker />
      </Suspense>
      <UseBeforeUnloadProvider>
        <NextTopLoader color="#22c55e" height={4} shadow={false} showSpinner={false} zIndex={1031} />
        <NuqsAdapter>{children}</NuqsAdapter>
      </UseBeforeUnloadProvider>
    </ThemeProvider>
  );
};

export default Providers;
