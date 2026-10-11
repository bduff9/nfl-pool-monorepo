import { Skeleton } from "@nfl-pool-monorepo/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nfl-pool-monorepo/ui/components/table";
import type { FC } from "react";

type PicksTableSkeletonProps = {
  pointsSkeletonClassName: string;
};

const PicksTableSkeleton: FC<PicksTableSkeletonProps> = ({ pointsSkeletonClassName }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="text-foreground font-semibold" scope="col">
          Game
        </TableHead>
        <TableHead className="text-foreground font-semibold" scope="col">
          Pick
        </TableHead>
        <TableHead className="text-foreground font-semibold" scope="col">
          Points
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {Array.from({ length: 16 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: loader rows have no identity
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-10 w-full bg-muted" />
          </TableCell>
          <TableCell>
            <Skeleton className="mx-auto size-10 bg-muted" />
          </TableCell>
          <TableCell>
            <Skeleton className={pointsSkeletonClassName} />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export default PicksTableSkeleton;
