"use client";

import { SidebarTrigger, useOptionalSidebar } from "@nfl-pool-monorepo/ui/components/sidebar";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC } from "react";

import { useHasAuthenticatedNav } from "@/components/AuthenticatedNavigation/authenticatedNavPresenceContext";

type Props = {
  className?: string;
};

const PageSidebarTrigger: FC<Props> = ({ className }) => {
  const sidebar = useOptionalSidebar();
  const hasNav = useHasAuthenticatedNav();

  if (!sidebar || !hasNav) {
    return null;
  }

  return <SidebarTrigger className={cn("size-10 md:size-7", className)} />;
};

export default PageSidebarTrigger;
