import { type FC, type ReactNode, ViewTransition } from "react";

type SharedElementProps = {
  children: ReactNode;
  // How the content fills the pair's box while it changes size on the way (see the shared classes in globals.css): at
  // its own size, centred (titles, charts) or from the start edge (a progress bar's labels), or stretched to the box (a
  // progress bar's bar, which grows or shrinks with it)
  fit?: "center" | "start" | "stretch";
  // Without a name the children render unwrapped, for elements that only sometimes have a partner to morph with
  name: string | undefined;
};

// share={{ "week-forward": "none", "week-back": "none", default: ... }} must stay alongside default="none", or the
// named pair silently stops morphing. A week change remounts the page content (see WeekTransition), so the old and new
// trees pair every named element; pinning the week types to "none" keeps those elements part of the week slide
// instead of morphing in place.
const SHARE_CLASSES = { center: "shared", start: "shared-start", stretch: "shared-stretch" } as const;

const SharedElement: FC<SharedElementProps> = ({ children, fit = "center", name }) => {
  if (!name) {
    return children;
  }

  return (
    <ViewTransition
      default="none"
      name={name}
      share={{ default: SHARE_CLASSES[fit], "week-back": "none", "week-forward": "none" }}
    >
      {children}
    </ViewTransition>
  );
};

export default SharedElement;
