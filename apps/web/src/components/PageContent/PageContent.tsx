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
    <div className="bg-gray-100/80 text-black min-h-screen flex-1" id={id}>
      <div className="px-1 pt-1">
        <PageSidebarTrigger />
      </div>
      <div className={cn(className)}>{children}</div>
    </div>
  );
};

export default PageContent;
