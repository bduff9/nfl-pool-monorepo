import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC, ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

const TextSeparator: FC<Props> = ({ children, className }) => (
  <div
    className={cn(
      "flex items-center text-center before:border-b before:border-black before:flex-1 before:mr-8 after:border-b after:border-black after:flex-1 after:ml-8",
      className,
    )}
  >
    {children}
  </div>
);

export default TextSeparator;
