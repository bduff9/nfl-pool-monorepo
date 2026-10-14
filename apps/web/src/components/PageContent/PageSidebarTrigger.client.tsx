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

  // Named so it stays put like the sidebar (see persistent-nav in globals.css) while the page around it slides. Every
  // page renders exactly one, through PageContent or the error and not-found pages, so the name is unique.
  return (
    <SidebarTrigger
      className={cn("size-11 md:size-7", className)}
      style={{ viewTransitionName: "page-sidebar-trigger" }}
    />
  );
};

export default PageSidebarTrigger;
