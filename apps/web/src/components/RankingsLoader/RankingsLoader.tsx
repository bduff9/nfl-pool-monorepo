import { Skeleton } from "@nfl-pool-monorepo/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nfl-pool-monorepo/ui/components/table";
import "server-only";

import type { FC } from "react";

import PageContent from "@/components/PageContent/PageContent";
import ProgressChartLoader from "@/components/ProgressChart/ProgressChartLoader";
import RankingPieChartLoader from "@/components/RankingPieChart/RankingPieChartLoader";
import SharedElement from "@/components/ViewTransitions/SharedElement";
import { WeekLink } from "@/components/WeekLink/WeekLink";

// The view transition names the real page uses at each slot, so the dashboard elements morph into this skeleton
type TransitionNames = {
  gamesChart: string;
  pointsChart: string;
  rankTitle: string;
  rankingPieChart: string;
  resultsTitle: string;
};

type Props = {
  // The table's column headings, rank first
  columns: Array<string>;
  rankTitle: string;
  resultsTitle: string;
  transitionNames: TransitionNames;
};

const ROW_COUNT = 20;

// The shared skeleton for the overall and weekly rankings pages
const RankingsLoader: FC<Props> = ({ columns, rankTitle, resultsTitle, transitionNames }) => {
  return (
    <div className="h-full flex" data-testid="route-loading">
      <PageContent className="mx-2 pt-0 md:pt-3 pb-4">
        <div className="flex flex-wrap items-start">
          <div className="hidden md:inline-block w-[25%] text-center h-[205px]">
            <SharedElement name={transitionNames.rankTitle}>
              <h2 className="mb-0 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">{rankTitle}</h2>
            </SharedElement>
            <RankingPieChartLoader transitionName={transitionNames.rankingPieChart} />
          </div>
          <div className="mt-4 block md:hidden">
            <WeekLink className="inline-block py-2.5 underline" href="/">
              &laquo; Back to Dashboard
            </WeekLink>
          </div>
          <div className="hidden md:inline-block flex-1 px-3">
            <SharedElement name={transitionNames.resultsTitle}>
              <h2 className="mb-4 scroll-m-20 text-center text-3xl font-semibold tracking-tight first:mt-0">
                {resultsTitle}
              </h2>
            </SharedElement>
            <ProgressChartLoader transitionName={transitionNames.pointsChart} />
            <ProgressChartLoader transitionName={transitionNames.gamesChart} />
          </div>
          <Table parentClassName="w-full mt-4 text-center">
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead className="text-center text-foreground font-semibold" key={column} scope="col">
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: ROW_COUNT }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: This is a loader and the key is not important
                <TableRow key={`table-loader-${i}`}>
                  <TableHead className="text-center text-foreground font-semibold" scope="row">
                    <Skeleton />
                  </TableHead>
                  {columns.slice(1).map((column) => (
                    <TableCell key={column}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PageContent>
    </div>
  );
};

export default RankingsLoader;
