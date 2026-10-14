import { type FC, type ReactNode, ViewTransition } from "react";

type SharedElementProps = {
  children: ReactNode;
  name: string;
};

// share={{ "week-forward": "none", "week-back": "none", default: "morph" }} must stay alongside default="none", or the
// named pair silently stops morphing. A week change remounts the page content (see WeekTransition), so the old and new
// trees pair every named element; pinning the week types to "none" keeps those elements part of the week slide
// instead of morphing in place.
const SharedElement: FC<SharedElementProps> = ({ children, name }) => (
  <ViewTransition default="none" name={name} share={{ default: "morph", "week-back": "none", "week-forward": "none" }}>
    {children}
  </ViewTransition>
);

export default SharedElement;
