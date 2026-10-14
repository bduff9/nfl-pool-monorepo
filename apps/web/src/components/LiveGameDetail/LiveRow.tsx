import { type FC, type ReactNode, ViewTransition } from "react";

import { REFRESH_TRANSITION } from "@/lib/refreshTransition";

/**
 * A play or drive row of a live game's lists. Render it with key={the play's or drive's id}: a live refresh that brings
 * a new one in slides it in at the top of its list (see row-in in globals.css). Only a refresh animates them: rows that
 * are there when the page or the lists first appear do not.
 */
const LiveRow: FC<{ children: ReactNode }> = ({ children }) => (
  <ViewTransition default="none" enter={{ default: "none", [REFRESH_TRANSITION]: "row-in" }}>
    {children}
  </ViewTransition>
);

export default LiveRow;
