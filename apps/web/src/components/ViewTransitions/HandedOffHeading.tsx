"use client";

import { type FC, type ReactNode, Suspense } from "react";

import { headingHandoff, useHandedOff } from "@/lib/sharedElementHandoff";

import SharedElement from "./SharedElement";

type HandedOffHeadingProps = {
  // The same classes as the page's own heading at this slot, so the two look the same and nothing changes when the page
  // replaces the skeleton
  className: string;
  // Shown when no page has rendered this title for this week (a fresh load), and while prerendering
  fallback: ReactNode;
  name: string;
};

const HandedOffHeadingText: FC<HandedOffHeadingProps> = ({ className, fallback, name }) => {
  const text = useHandedOff(headingHandoff, name);

  if (text === undefined) {
    return fallback;
  }

  return (
    <SharedElement name={name}>
      <h2 className={className}>{text}</h2>
    </SharedElement>
  );
};

// A loading skeleton's title with the text the last page showed under the same name, so it moves between the pages as
// the same words instead of crossfading into a placeholder's text (such as "Week 1 Rank" into "Week Rank")
const HandedOffHeading: FC<HandedOffHeadingProps> = (props) => (
  <Suspense fallback={props.fallback}>
    <HandedOffHeadingText {...props} />
  </Suspense>
);

export default HandedOffHeading;
