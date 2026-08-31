import { Skeleton } from "@nfl-pool-monorepo/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nfl-pool-monorepo/ui/components/table";
import type { FC } from "react";
import "server-only";

import PageContent from "@/components/PageContent/PageContent";

const MakePicksLoading: FC = () => (
  <div className="h-full flex flex-col md:mx-3" data-testid="route-loading">
    <PageContent className="pt-3 pb-[70px]">
      <Skeleton className="mb-4 h-8 w-64 bg-gray-300" />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-black font-semibold" scope="col">
              Game
            </TableHead>
            <TableHead className="text-black font-semibold" scope="col">
              Pick
            </TableHead>
            <TableHead className="text-black font-semibold" scope="col">
              Points
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 16 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: loader rows have no identity
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-10 w-full bg-gray-300" />
              </TableCell>
              <TableCell>
                <Skeleton className="mx-auto size-10 bg-gray-300" />
              </TableCell>
              <TableCell>
                <Skeleton className="mx-auto h-8 w-8 bg-gray-300" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </PageContent>
  </div>
);

export default MakePicksLoading;
