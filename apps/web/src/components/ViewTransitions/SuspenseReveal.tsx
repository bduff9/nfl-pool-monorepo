import { type FC, type ReactNode, Suspense, ViewTransition } from "react";

type SuspenseRevealProps = {
  children: ReactNode;
  fallback: ReactNode;
};

// A Suspense whose skeleton slides down and out as the content slides up and in once it resolves. Both sides use
// default="none", so only the reveal itself animates: a route change that commits the skeleton or the content is
// animated by the page's outer PageTransition (React only animates the outermost entering or exiting boundary), and a
// refresh or week change keeps the already-revealed content without showing the skeleton again. Named elements in the
// skeleton still pair with their real counterparts and morph.
const SuspenseReveal: FC<SuspenseRevealProps> = ({ children, fallback }) => (
  <Suspense
    fallback={
      <ViewTransition default="none" exit="reveal-out">
        {fallback}
      </ViewTransition>
    }
  >
    <ViewTransition default="none" enter="reveal-in">
      {children}
    </ViewTransition>
  </Suspense>
);

export default SuspenseReveal;
