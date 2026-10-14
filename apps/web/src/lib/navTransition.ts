export type NavTransitionType = "nav-back" | "nav-forward" | "nav-fade";

const stripQuery = (href: string): string => href.split("?")[0] ?? href;

// Dashboard is the root; a game page sits under the scoreboard; every other page is a top-level destination
/** @public exported for unit testing only */
export const navDepth = (pathname: string): number => {
  const path = stripQuery(pathname);

  if (path === "/") return 0;
  if (path.startsWith("/scoreboard/game/")) return 2;

  return 1;
};

export const getNavTransitionTypes = (fromPathname: string, toHref: string): NavTransitionType[] => {
  const from = stripQuery(fromPathname);
  const to = stripQuery(toHref);

  if (from === to) return [];

  const fromDepth = navDepth(from);
  const toDepth = navDepth(to);

  if (toDepth > fromDepth) return ["nav-forward"];
  if (toDepth < fromDepth) return ["nav-back"];

  return ["nav-fade"];
};
