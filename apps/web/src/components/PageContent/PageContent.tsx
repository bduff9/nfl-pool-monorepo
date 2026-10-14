import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC, ReactNode } from "react";

import PageSidebarTrigger from "./PageSidebarTrigger.client";

type PageContentProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

const PageContent: FC<PageContentProps> = ({ children, className, id }) => {
  return (
    <div className="relative text-foreground flex flex-col flex-1 min-h-0 min-w-0" id={id}>
      {/* The dark scrim over the background photo, named page-scrim (see globals.css) so it stays put while the page
          on top of it slides and fades, instead of fading with the page and flashing the photo through */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-background/80"
        style={{ viewTransitionName: "page-scrim" }}
      />
      <div className="px-1 pt-1 shrink-0">
        <PageSidebarTrigger />
      </div>
      <div className={cn("flex-1 min-h-0", className)}>{children}</div>
    </div>
  );
};

export default PageContent;
