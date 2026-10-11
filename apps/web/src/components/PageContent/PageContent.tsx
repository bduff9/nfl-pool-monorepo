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
    <div className="bg-background/80 text-foreground flex flex-col flex-1 min-h-0 min-w-0" id={id}>
      <div className="px-1 pt-1 shrink-0">
        <PageSidebarTrigger />
      </div>
      <div className={cn("flex-1 min-h-0", className)}>{children}</div>
    </div>
  );
};

export default PageContent;
