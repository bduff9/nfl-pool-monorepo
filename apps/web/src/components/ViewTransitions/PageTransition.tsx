import { type FC, type ReactNode, ViewTransition } from "react";

const directionalSlide = {
  default: "none",
  "nav-back": "nav-back",
  "nav-fade": "nav-fade",
  "nav-forward": "nav-forward",
} as const;

// For a page with no place in the navigation depth (404, error): it fades in and out whichever way it is reached
const fadeOnly = {
  default: "none",
  "nav-back": "nav-fade",
  "nav-fade": "nav-fade",
  "nav-forward": "nav-fade",
} as const;

type PageTransitionProps = {
  children: ReactNode;
  motion?: "fade" | "slide";
};

const PageTransition: FC<PageTransitionProps> = ({ children, motion = "slide" }) => {
  const animation = motion === "fade" ? fadeOnly : directionalSlide;

  return (
    <ViewTransition default="none" enter={animation} exit={animation}>
      {children}
    </ViewTransition>
  );
};

export default PageTransition;
