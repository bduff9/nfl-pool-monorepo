import { type FC, type ReactNode, ViewTransition } from "react";

// Only the week types slide, so a route change (animated by the page's outer PageTransition) does not animate twice
const weekSlide = {
  default: "none",
  "week-back": "nav-back",
  "week-forward": "nav-forward",
} as const;

type WeekTransitionProps = {
  children: ReactNode;
};

// Render with key={selectedWeek}: a week change re-renders the same page, so the key is what makes the old week exit
// and the new week enter
const WeekTransition: FC<WeekTransitionProps> = ({ children }) => (
  <ViewTransition default="none" enter={weekSlide} exit={weekSlide}>
    {children}
  </ViewTransition>
);

export default WeekTransition;
