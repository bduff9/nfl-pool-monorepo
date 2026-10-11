import { cn } from "@nfl-pool-monorepo/utils/styles";

export const getNavLinkClassName = (base: string, isActive: boolean, isNested: boolean) =>
  cn(base, isActive && "text-green-700 bg-muted", isNested ? "ps-8 text-lg font-normal" : "ps-4");
