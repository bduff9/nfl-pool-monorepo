import { type FC, type ReactNode, ViewTransition } from "react";

type SharedElementProps = {
  children: ReactNode;
  name: string;
};

// share={{ "week-change": "none", default: "morph" }} must stay alongside default="none", or the named pair silently stops morphing.
// A week change re-renders the same page, so the old and new trees pair every named element; pinning it to "none"
// there keeps those elements part of the page's directional slide instead of crossfading in place.
const SharedElement: FC<SharedElementProps> = ({ children, name }) => (
  <ViewTransition default="none" name={name} share={{ default: "morph", "week-change": "none" }}>
    {children}
  </ViewTransition>
);

export default SharedElement;
