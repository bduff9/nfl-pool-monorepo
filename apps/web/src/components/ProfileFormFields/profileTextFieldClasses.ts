import { cn } from "@nfl-pool-monorepo/utils/styles";

export const getProfileLabelClassName = (required: boolean): string => cn("h-5", required && "required");

export const getProfileInputClassName = (readOnly: boolean, hasError: boolean): string =>
  cn(readOnly ? "border-0 shadow-none" : hasError && "border-red-600");
