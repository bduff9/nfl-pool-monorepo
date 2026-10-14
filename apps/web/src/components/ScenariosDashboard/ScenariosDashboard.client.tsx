"use client";

import "client-only";

import type { FC } from "react";

import SharedElement from "@/components/ViewTransitions/SharedElement";

export const ScenarioDashboardTitle: FC = () => {
  return (
    <SharedElement name="scenarioTitle">
      <h2 className="mb-0 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">Still In Play</h2>
    </SharedElement>
  );
};
