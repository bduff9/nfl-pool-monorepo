import { type FC, type ReactNode, ViewTransition } from "react";

const directionalSlide = {
  default: "none",
  "nav-back": "nav-back",
  "nav-forward": "nav-forward",
} as const;

type PageTransitionProps = {
  children: ReactNode;
};

const PageTransition: FC<PageTransitionProps> = ({ children }) => {
  return (
    <ViewTransition default="none" enter={directionalSlide} exit={directionalSlide}>
      {children}
    </ViewTransition>
  );
};

export default PageTransition;
