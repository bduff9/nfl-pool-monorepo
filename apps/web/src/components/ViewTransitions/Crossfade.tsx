import { type FC, type ReactNode, ViewTransition } from "react";

type CrossfadeProps = {
  children: ReactNode;
};

const Crossfade: FC<CrossfadeProps> = ({ children }) => {
  return (
    <ViewTransition default="none" enter="auto">
      {children}
    </ViewTransition>
  );
};

export default Crossfade;
