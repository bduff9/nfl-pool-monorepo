import { cn } from "@nfl-pool-monorepo/utils/styles";

export const toPercent = (value: number, max: number) => (max > 0 ? (value / max) * 100 : 0);

export const getBarClassName = (base: string, isOver: boolean) => cn(base, !isOver && "in-progress");
