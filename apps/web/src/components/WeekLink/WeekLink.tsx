"use client";

import type { Route } from "next";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useQueryState } from "nuqs";
import type { ComponentProps, FC } from "react";

import { getNavTransitionTypes } from "@/lib/navTransition";
import { weekParser } from "@/lib/weekParser";
import { appendWeekIfMissing } from "@/lib/weekSearchParams";

type WeekLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: Route;
  preserveWeek?: boolean;
};

// Rendered inside the link so it can tell when that link's navigation is pending; globals.css dims a link containing it
const PendingMarker: FC = () => {
  const { pending } = useLinkStatus();

  return pending ? <span aria-hidden data-link-pending hidden /> : null;
};

export const WeekLink: FC<WeekLinkProps> = ({ children, href, preserveWeek = true, transitionTypes, ...rest }) => {
  const [week] = useQueryState("week", weekParser);
  const pathname = usePathname();
  const resolvedHref = preserveWeek ? appendWeekIfMissing(href, week) : href;

  return (
    <Link
      href={resolvedHref}
      transitionTypes={transitionTypes ?? getNavTransitionTypes(pathname, resolvedHref)}
      {...rest}
    >
      {children}
      <PendingMarker />
    </Link>
  );
};
