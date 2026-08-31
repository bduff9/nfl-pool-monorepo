"use client";

import { AnimatePresence, m, useMotionTemplate, useSpring } from "framer-motion";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQueryState } from "nuqs";
import type { ComponentProps, FC, ReactNode } from "react";
import { createContext, Suspense, useContext, useEffect, useRef, useState } from "react";

import { weekParser } from "@/lib/weekParser";
import { appendWeekIfMissing } from "@/lib/weekSearchParams";

const ProgressBarContext = createContext<ReturnType<typeof useProgress> | null>(null);

export const useProgressBar = () => {
  const progress = useContext(ProgressBarContext);

  if (progress === null) {
    throw new Error("Need to be inside provider");
  }

  return progress;
};

type ProgressBarProps = {
  className: string;
  children: ReactNode;
};

export const ProgressBar: FC<ProgressBarProps> = ({ className, children }) => {
  const progress = useProgress();
  const width = useMotionTemplate`${progress.value}%`;

  return (
    <ProgressBarContext.Provider value={progress}>
      <AnimatePresence onExitComplete={progress.reset}>
        {progress.state !== "complete" && <m.div className={className} exit={{ opacity: 0 }} style={{ width }} />}
      </AnimatePresence>

      <Suspense fallback={null}>
        <NavigationProgressSync />
      </Suspense>

      {children}
    </ProgressBarContext.Provider>
  );
};

type ProgressBarLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: Route;
  preserveWeek?: boolean;
};

export const ProgressBarLink: FC<ProgressBarLinkProps> = ({
  children,
  href,
  onClick,
  preserveWeek = true,
  ...rest
}) => {
  const progress = useProgressBar();
  const [week] = useQueryState("week", weekParser);
  const resolvedHref = preserveWeek ? appendWeekIfMissing(href, week) : href;

  const handleClick: ComponentProps<typeof Link>["onClick"] = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }

    onClick?.(e);

    if (e.defaultPrevented) {
      return;
    }

    progress.start();
  };

  return (
    <Link href={resolvedHref} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
};

const NavigationProgressSync: FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const progress = useProgressBar();
  const locationKey = `${pathname}?${searchParams.toString()}`;
  const previousKey = useRef(locationKey);

  useEffect(() => {
    if (previousKey.current !== locationKey) {
      progress.done();
      previousKey.current = locationKey;
    }
  }, [locationKey, progress]);

  return null;
};

const useProgress = () => {
  const [state, setState] = useState<"initial" | "in-progress" | "completing" | "complete">("initial");
  const value = useSpring(0, {
    damping: 25,
    mass: 0.5,
    restDelta: 0.1,
    stiffness: 300,
  });

  useInterval(
    () => {
      if (value.get() === 100) {
        value.jump(0);
      }

      const current = value.get();

      let diff: number;

      if (current === 0) {
        diff = 15;
      } else if (current < 50) {
        diff = rand(1, 10);
      } else {
        diff = rand(1, 5);
      }

      value.set(Math.min(current + diff, 99));
    },
    state === "in-progress" ? 750 : null,
  );

  // react-doctor-disable-next-line effect-needs-cleanup -- value.on(...)'s unsubscribe IS returned below unconditionally as this effect's cleanup
  useEffect(() => {
    if (state === "initial") {
      value.jump(0);
    } else if (state === "completing") {
      value.set(100);
    }

    return value.on("change", (latest) => {
      if (latest === 100) {
        setState("complete");
      }
    });
  }, [value, state]);

  const reset = () => {
    setState("initial");
  };

  const start = () => {
    setState("in-progress");
  };

  const done = () => {
    setState((state) => (state === "initial" || state === "in-progress" ? "completing" : state));
  };

  return { done, reset, start, state, value };
};

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }

    if (delay !== null) {
      tick();

      const id = setInterval(tick, delay);

      return () => clearInterval(id);
    }
  }, [delay]);
};
