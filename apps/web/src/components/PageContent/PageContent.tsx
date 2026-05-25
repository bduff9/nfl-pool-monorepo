import { SidebarTrigger } from "@nfl-pool-monorepo/ui/components/sidebar";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC, ReactNode } from "react";

type PageContentProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

const PageContent: FC<PageContentProps> = ({ children, className, id }) => {
  return (
    <div className="bg-gray-100/80 text-black min-h-screen flex-1" id={id}>
      <div className="px-1 pt-1">
        <SidebarTrigger className="size-10 md:size-7" />
      </div>
      <div className={cn(className)}>{children}</div>
    </div>
  );
};

export default PageContent;
