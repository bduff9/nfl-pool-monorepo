"use client";

import { AnimatePresence, motion, useMotionTemplate, useSpring } from "framer-motion";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, FC, ReactNode } from "react";
import { createContext, startTransition, useContext, useEffect, useRef, useState } from "react";

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
        {progress.state !== "complete" && <motion.div className={className} exit={{ opacity: 0 }} style={{ width }} />}
      </AnimatePresence>

      {children}
    </ProgressBarContext.Provider>
  );
};

type ProgressBarLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: Route;
};

export const ProgressBarLink: FC<ProgressBarLinkProps> = ({ children, href, onClick, ...rest }) => {
  const progress = useProgressBar();
  const router = useRouter();

  return (
    <Link
      href={href}
      onClick={(e) => {
        onClick?.(e);

        if (e.defaultPrevented) {
          return;
        }

        if (e.metaKey) {
          return;
        }
        e.preventDefault();
        progress.start();

        startTransition(() => {
          router.push(href);
          progress.done();
        });
      }}
      {...rest}
    >
      {children}
    </Link>
  );
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
      // If we start progress but the bar is currently complete, reset it first.
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
