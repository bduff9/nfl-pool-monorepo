import { useSearchParams } from "next/navigation";
import { useLayoutEffect, useSyncExternalStore } from "react";

import type { ProgressChartData } from "@/components/ProgressChart/progressChartHelpers";
import type { PieChartData } from "@/components/RankingPieChart/rankingPieChartData";
import type { SurvivorIconData } from "@/components/SurvivorDashboardIcon/survivorIconData";

/*
 * Hands the data behind a shared element (a ranking pie, a progress bar, a title, the survivor icon) from one page to
 * the next on the client. A page's first commit after a navigation is its loading skeleton, because its data loads
 * after the navigation, so without this the dashboard's filled chart would morph into a grey placeholder and back. With
 * it, the skeleton renders the same element, filled, from the data the last page rendered under the same view
 * transition name, and the page's own element later replaces it with the same pixels.
 *
 * Each value is remembered with the URL's week parameter, and only handed to a page whose URL has the same one, so a
 * page for another week never shows this week's numbers first. Read through useSyncExternalStore with a server snapshot
 * of undefined, so server rendering and hydration always show the plain skeleton.
 */
type Entry<T> = {
  value: T;
  week: string | null;
};

export type Handoff<T> = {
  find: (name: string, week: string | null) => T | undefined;
  remember: (name: string, week: string | null, value: T) => void;
};

const createHandoff = <T>(): Handoff<T> => {
  const entries = new Map<string, Entry<T>>();

  return {
    find: (name, week) => {
      const entry = entries.get(name);

      return entry?.week === week ? entry.value : undefined;
    },
    remember: (name, week, value) => {
      const entry = entries.get(name);

      // Keep the value already handed out when nothing changed: a skeleton reading it renders the element, which
      // remembers its (equal, but new) props again, and a new value there would make the skeleton render again forever
      if (entry?.week === week && JSON.stringify(entry.value) === JSON.stringify(value)) {
        return;
      }

      entries.set(name, { value, week });
    },
  };
};

/** Remembers what this element rendered, after every commit, under the week of the URL it rendered for. */
export const useRememberHandoff = <T>(handoff: Handoff<T>, name: string | undefined, value: T): void => {
  useLayoutEffect(() => {
    if (name) {
      handoff.remember(name, new URLSearchParams(window.location.search).get("week"), value);
    }
  });
};

const subscribeToNothing = () => () => {};
const getServerSnapshot = () => undefined;

/**
 * What the last page rendered under this name, if it was for this URL's week. It reads the search params, so render it
 * inside a Suspense boundary: while prerendering, the URL is unknown and the boundary's fallback (the skeleton) shows.
 */
export const useHandedOff = <T>(handoff: Handoff<T>, name: string): T | undefined => {
  const week = useSearchParams().get("week");

  return useSyncExternalStore(subscribeToNothing, () => handoff.find(name, week), getServerSnapshot);
};

// One handoff per kind of shared element, keyed by view transition name
export const headingHandoff = createHandoff<string>();
export const progressChartHandoff = createHandoff<ProgressChartData>();
export const rankingPieChartHandoff = createHandoff<Array<PieChartData>>();
export const survivorDashboardIconHandoff = createHandoff<SurvivorIconData>();
