import { type FC, type ReactNode, ViewTransition } from "react";

type SharedElementProps = {
  children: ReactNode;
  name: string;
};

// share="morph" must stay alongside default="none", or the named pair silently stops morphing
const SharedElement: FC<SharedElementProps> = ({ children, name }) => (
  <ViewTransition default="none" name={name} share="morph">
    {children}
  </ViewTransition>
);

export default SharedElement;
