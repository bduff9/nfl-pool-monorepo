import { Skeleton } from "@nfl-pool-monorepo/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nfl-pool-monorepo/ui/components/table";
import "server-only";

import type { FC } from "react";

import PageContent from "@/components/PageContent/PageContent";
import ProgressChartLoader from "@/components/ProgressChart/ProgressChartLoader";
import RankingPieChartLoader from "@/components/RankingPieChart/RankingPieChartLoader";
import { WeekLink } from "@/components/WeekLink/WeekLink";

type Props = {
  // The table's column headings, rank first
  columns: Array<string>;
  rankTitle: string;
  resultsTitle: string;
};

const ROW_COUNT = 20;

// The shared skeleton for the overall and weekly rankings pages
const RankingsLoader: FC<Props> = ({ columns, rankTitle, resultsTitle }) => {
  return (
    <div className="h-full flex" data-testid="route-loading">
      <PageContent className="mx-2 pt-0 md:pt-3 pb-4">
        <div className="flex flex-wrap">
          <div className="hidden md:inline-block w-1/2 text-center h-[205px]">
            <h2 className="mb-0">{rankTitle}</h2>
            <div className="mt-4">
              <RankingPieChartLoader />
            </div>
          </div>
          <div className="mt-4 block md:hidden">
            <WeekLink className="inline-block py-2.5 underline" href="/">
              &laquo; Back to Dashboard
            </WeekLink>
          </div>
          <div className="hidden md:inline-block w-1/2 px-3">
            <h2 className="mb-4 text-center">{resultsTitle}</h2>
            <ProgressChartLoader />
            <ProgressChartLoader />
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
