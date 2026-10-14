import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nfl-pool-monorepo/ui/components/table";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import { type ReactNode, ViewTransition } from "react";

import { REFRESH_TRANSITION } from "@/lib/refreshTransition";
import { ROW_MOVE } from "@/lib/rowMove";

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

// A refresh (pull to refresh, coming back to the app) that changes the order glides each row that changed place to its
// new place. A row is keyed by its place, so one that moves remounts there and pairs with its old self by name; rows that
// keep their place stay mounted and unnamed, so an unchanged refresh starts no view transition. Nothing else (first
// render, navigation, a week change) pairs them.
const ROW_SHARE = { default: "none", [REFRESH_TRANSITION]: ROW_MOVE } as const;

const RankingsTable = <T extends RankingRow>({
  currentUserId,
  extraHeadings,
  renderExtraCells,
  rows,
}: RankingsTableProps<T>) => (
  // Separate borders, drawn by the cells, so a gliding row carries its divider with it: collapsed borders are drawn by
  // the table and would stay behind, striking through the rows moving over them
  <Table className="border-separate border-spacing-0" parentClassName="w-full mt-4 text-center">
    <TableHeader>
      <TableRow className="[&>*]:border-b">
        {[...BASE_HEADINGS, ...extraHeadings].map((heading) => (
          <TableHead className="text-center text-foreground font-semibold" key={heading} scope="col">
            {heading}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody className="[&>tr:last-child>*]:border-b-0">
      {rows.map((row, index) => (
        <ViewTransition
          default="none"
          // react-doctor-disable-next-line react-doctor/no-array-index-as-key -- keyed by place too (see ROW_SHARE)
          key={`user-rank-for-${row.UserID}-at-${
            // biome-ignore lint/suspicious/noArrayIndexKey: keyed by place too, so a row that moves remounts and pairs
            index
          }`}
          name={`rank-row-${row.UserID}`}
          share={ROW_SHARE}
        >
          <TableRow className={cn("[&>*]:border-b", row.UserID === currentUserId && "bg-amber-300 [&_*]:text-black")}>
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
        </ViewTransition>
      ))}
    </TableBody>
  </Table>
);

export default RankingsTable;
