"use client";

import "client-only";
import { useRouter } from "next/navigation";
import { type PropsWithChildren, useEffect, useId } from "react";

let activeIds: string[] = [];
let isForceRouting = false;
let lastKnownHref: string;

export const useBeforeUnload = (isActive = true) => {
  const id = useId();

  // Handle <Link> clicks & onbeforeunload(attempting to close/refresh browser)
  useEffect(() => {
    if (!isActive) {
      return;
    }

    lastKnownHref = window.location.href;

    activeIds.push(id);

    const handleAnchorClick = (event: Event) => {
      const targetUrl = (event.currentTarget as HTMLAnchorElement).href;
      const currentUrl = window.location.href;

      if (targetUrl !== currentUrl) {
        const res = beforeUnloadFn();

        if (!res) {
          event.preventDefault();
        }

        lastKnownHref = window.location.href;
      }
    };

    let anchorElements: HTMLAnchorElement[] = [];

    const disconnectAnchors = () => {
      for (const anchor of anchorElements) {
        anchor.removeEventListener("click", handleAnchorClick);
      }
    };

    const handleMutation = () => {
      disconnectAnchors();

      anchorElements = Array.from(document.querySelectorAll("a[href]"));

      for (const anchor of anchorElements) {
        anchor.addEventListener("click", handleAnchorClick);
      }
    };

    const mutationObserver = new MutationObserver(handleMutation);

    mutationObserver.observe(document.body, { childList: true, subtree: true });
    addEventListener("beforeunload", beforeUnloadFn);

    return () => {
      removeEventListener("beforeunload", beforeUnloadFn);
      disconnectAnchors();
      mutationObserver.disconnect();
      activeIds = activeIds.filter((activeId) => activeId !== id);
    };
  }, [isActive, id]);
};

const beforeUnloadFn = (event?: BeforeUnloadEvent) => {
  if (isForceRouting) {
    return true;
  }

  const message = "Discard unsaved changes?";

  if (event) {
    event.returnValue = message;

    return message;
  }

  return confirm(message);
};

export const UseBeforeUnloadProvider = ({ children }: PropsWithChildren) => {
  const router = useRouter();

  useEffect(() => {
    lastKnownHref = window.location.href;
  });

  // Hack nextjs popstate impl, so it will include route cancellation.
  // This Provider has to be rendered in the layout phase wrapping the page.
  // biome-ignore lint/correctness/useExhaustiveDependencies: router.replace is not needed in the deps
  useEffect(() => {
    // biome-ignore lint/suspicious/noExplicitAny: Popstate handler is not known
    let nextjsPopStateHandler: (...args: any[]) => void;

    // biome-ignore lint/suspicious/noExplicitAny: Popstate handler is not known
    function popStateHandler(...args: any[]) {
      useBeforeUnload.ensureSafeNavigation(
        () => {
          nextjsPopStateHandler(...args);
          lastKnownHref = window.location.href;
        },
        () => {
          router.replace(lastKnownHref, { scroll: false });
        },
      );
    }

    addEventListener("popstate", popStateHandler);

    const originalAddEventListener = window.addEventListener;

    // biome-ignore lint/suspicious/noExplicitAny: Popstate handler is not known
    window.addEventListener = (...args: any[]) => {
      if (args[0] === "popstate") {
        nextjsPopStateHandler = args[1];
        window.addEventListener = originalAddEventListener;
      } else {
        // @ts-expect-error spread can only be used on tuples or into a spread argument
        originalAddEventListener(...args);
      }
    };

    return () => {
      window.addEventListener = originalAddEventListener;
      removeEventListener("popstate", popStateHandler);
    };
  }, []);

  return children;
};

useBeforeUnload.forceRoute = async (cb: () => void | Promise<void>) => {
  try {
    isForceRouting = true;
    await cb();
  } finally {
    isForceRouting = false;
  }
};

useBeforeUnload.ensureSafeNavigation = (onPerformRoute: () => void, onRouteRejected?: () => void) => {
  if (activeIds.length === 0 || beforeUnloadFn()) {
    onPerformRoute();
  } else {
    onRouteRejected?.();
  }
};
