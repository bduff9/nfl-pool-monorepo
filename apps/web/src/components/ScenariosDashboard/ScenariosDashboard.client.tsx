"use client";

import "client-only";

import { m } from "framer-motion";
import type { FC } from "react";

export const ScenarioDashboardTitle: FC = () => {
  return (
    <m.h2 className="mb-0 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0" layoutId="scenarioTitle">
      Still In Play
    </m.h2>
  );
};
