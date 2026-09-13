/*******************************************************************************
 * NFL Confidence Pool FE - the frontend implementation of an NFL confidence pool.
 * Copyright (C) 2015-present Brian Duffey
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see {http://www.gnu.org/licenses/}.
 * Home: https://asitewithnoname.com/
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nfl-pool-monorepo/ui/components/table";
import { addOrdinal } from "@nfl-pool-monorepo/utils/numbers";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { type FC, Suspense } from "react";
import "server-only";

import { getHistory, type HistoryEntry } from "@nfl-pool-monorepo/db/src/queries/history";

import CustomHead from "@/components/CustomHead/CustomHead";
import PageContent from "@/components/PageContent/PageContent";
import PageTransition from "@/components/ViewTransitions/PageTransition";
import { requireLoggedIn } from "@/lib/auth";

import HistoryLoading from "./loading";

const TITLE = "Pool History";

export const metadata: Metadata = {
  title: TITLE,
};

const displayName = (entry: HistoryEntry): string =>
  entry.UserFirstName && entry.UserLastName
    ? `${entry.UserFirstName} ${entry.UserLastName}`
    : (entry.UserName ?? "Unknown");

type HistoryYearSectionProps = {
  entries: HistoryEntry[];
  year: number;
};

const HistoryYearSection: FC<HistoryYearSectionProps> = ({ entries, year }) => {
  const overall = entries
    .filter((entry) => entry.HistoryType === "Overall")
    .sort((a, b) => a.HistoryPlace - b.HistoryPlace);
  const survivor = entries
    .filter((entry) => entry.HistoryType === "Survivor")
    .sort((a, b) => a.HistoryPlace - b.HistoryPlace);
  const weekly = entries.filter((entry) => entry.HistoryType === "Weekly");

  const weeklyByWeek = new Map<number, HistoryEntry[]>();

  for (const entry of weekly) {
    const week = entry.HistoryWeek ?? 0;

    weeklyByWeek.set(week, [...(weeklyByWeek.get(week) ?? []), entry]);
  }

  return (
    <section className="mb-8">
      <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mb-4">{year}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="border border-border rounded-lg p-4">
          <h3 className="text-xl font-semibold mb-2">Overall</h3>
          {overall.length === 0 ? (
            <p className="text-muted-foreground">No results recorded</p>
          ) : (
            <ol className="list-none space-y-1">
              {overall.map((entry) => (
                <li key={`overall-${entry.HistoryPlace}-${entry.UserID}`}>
                  {addOrdinal(entry.HistoryPlace)}: {displayName(entry)}
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="border border-border rounded-lg p-4">
          <h3 className="text-xl font-semibold mb-2">Survivor</h3>
          {survivor.length === 0 ? (
            <p className="text-muted-foreground">No results recorded</p>
          ) : (
            <ol className="list-none space-y-1">
              {survivor.map((entry) => (
                <li key={`survivor-${entry.HistoryPlace}-${entry.UserID}`}>
                  {addOrdinal(entry.HistoryPlace)}: {displayName(entry)}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
      {weeklyByWeek.size > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-lg font-medium">Weekly winners</summary>
          <Table className="mt-2">
            <TableHeader>
              <TableRow>
                <TableHead>Week</TableHead>
                <TableHead>Winner</TableHead>
                <TableHead>Runner-up</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...weeklyByWeek.entries()]
                .sort((a, b) => a[0] - b[0])
                .map(([week, weekEntries]) => {
                  const sorted = [...weekEntries].sort((a, b) => a.HistoryPlace - b.HistoryPlace);

                  return (
                    <TableRow key={week}>
                      <TableCell className={cn("font-medium")}>{week}</TableCell>
                      <TableCell>{sorted[0] ? displayName(sorted[0]) : "-"}</TableCell>
                      <TableCell>{sorted[1] ? displayName(sorted[1]) : "-"}</TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </details>
      )}
    </section>
  );
};

const HistoryPageBody: FC = async () => {
  const redirectUrl = await requireLoggedIn();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const history = await getHistory();
  const byYear = new Map<number, HistoryEntry[]>();

  for (const entry of history) {
    byYear.set(entry.HistoryYear, [...(byYear.get(entry.HistoryYear) ?? []), entry]);
  }

  const years = [...byYear.keys()].sort((a, b) => b - a);

  return (
    <PageTransition>
      <div className="h-full flex flex-col md:mx-3">
        <CustomHead title={TITLE} />
        <PageContent className="px-3 pt-5 pb-4 md:px-5 md:pt-3">
          <h1 className="text-4xl font-semibold tracking-tight mb-6">{TITLE}</h1>
          {years.length === 0 ? (
            <p className="text-muted-foreground">No history recorded yet.</p>
          ) : (
            years.map((year) => <HistoryYearSection entries={byYear.get(year) ?? []} key={year} year={year} />)
          )}
        </PageContent>
      </div>
    </PageTransition>
  );
};

const HistoryPage: FC = () => (
  <Suspense fallback={<HistoryLoading />}>
    <HistoryPageBody />
  </Suspense>
);

export default HistoryPage;
