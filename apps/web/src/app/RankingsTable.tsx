import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nfl-pool-monorepo/ui/components/table";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { ReactNode } from "react";

type RankingRow = {
  GamesCorrect: number;
  PointsEarned: number;
  Rank: number;
  TeamName: string;
  Tied: boolean | number;
  UserID: number;
  UserName: string;
};

type RankingsTableProps<T extends RankingRow> = {
  currentUserId: number;
  extraHeadings: string[];
  renderExtraCells: (row: T) => ReactNode;
  rows: T[];
};

const BASE_HEADINGS = ["Rank", "Team", "Owner", "Points", "Games Correct"];

const RankingsTable = <T extends RankingRow>({
  currentUserId,
  extraHeadings,
  renderExtraCells,
  rows,
}: RankingsTableProps<T>) => (
  <Table parentClassName="w-full mt-4 text-center">
    <TableHeader>
      <TableRow>
        {[...BASE_HEADINGS, ...extraHeadings].map((heading) => (
          <TableHead className="text-center text-foreground font-semibold" key={heading} scope="col">
            {heading}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map((row) => (
        <TableRow
          className={cn(row.UserID === currentUserId && "bg-amber-300 [&_*]:text-black")}
          key={`user-rank-for-${row.UserID}`}
        >
          <TableHead className="text-center text-foreground font-semibold" scope="row">
            {row.Tied ? "T" : ""}
            {row.Rank}
          </TableHead>
          <TableCell>{row.TeamName}</TableCell>
          <TableCell>{row.UserName}</TableCell>
          <TableCell>{row.PointsEarned}</TableCell>
          <TableCell>{row.GamesCorrect}</TableCell>
          {renderExtraCells(row)}
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export default RankingsTable;
