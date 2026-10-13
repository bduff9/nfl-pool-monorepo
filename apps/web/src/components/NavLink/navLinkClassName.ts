import { cn } from "@nfl-pool-monorepo/utils/styles";

export const getNavLinkClassName = (base: string, isActive: boolean, isNested: boolean) =>
  cn(base, isActive && "text-green-700 bg-muted", isNested ? "ps-8 text-lg font-normal" : "ps-4");

// Exact match by default; `includeSubpages` also lights the link up on pages under it (e.g. a game page under the scoreboard)
export const isNavLinkActive = (pathname: string, href: string | undefined, includeSubpages: boolean): boolean =>
  !!href && (pathname === href || (includeSubpages && pathname.startsWith(`${href}/`)));
