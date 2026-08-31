import type { FC } from "react";
import { PiFootballDuotone } from "react-icons/pi";
import "server-only";

const PageLoading: FC = () => (
  <div className="flex h-full w-full items-center justify-center py-24" data-testid="route-loading">
    <PiFootballDuotone aria-hidden="true" className="size-10 animate-spin text-primary" />
    <span className="sr-only">Loading&hellip;</span>
  </div>
);

export default PageLoading;
