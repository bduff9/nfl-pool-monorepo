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

import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { type FC, Fragment, Suspense } from "react";
import "server-only";

import CustomHead from "@/components/CustomHead/CustomHead";
import GameStatusDisplay from "@/components/GameStatusDisplay/GameStatusDisplay";
import PageContent from "@/components/PageContent/PageContent";
import RetryableSection from "@/components/RetryableSection/RetryableSection";
import ScoreboardDate from "@/components/ScoreboardDate/ScoreboardDate";
import ScoreboardLiveRefresh from "@/components/ScoreboardLiveRefresh/ScoreboardLiveRefresh";
import ScoreboardTeam from "@/components/ScoreboardTeam/ScoreboardTeam";
import Crossfade from "@/components/ViewTransitions/Crossfade";
import PageTransition from "@/components/ViewTransitions/PageTransition";
import { requireRegistered } from "@/lib/auth";
import { formatDateForKickoff } from "@/lib/dates";
import { getGamesForWeekScoreboardCached } from "@/server/loaders/game";
import { getSelectedWeekFromParams } from "@/server/loaders/week";

import ScoreboardLoader from "./loading";

const TITLE = "Scoreboard";

export const metadata: Metadata = {
  title: TITLE,
};

type ScoreboardGamesProps = {
  selectedWeek: number;
};

const ScoreboardGames: FC<ScoreboardGamesProps> = async ({ selectedWeek }) => {
  const games = await getGamesForWeekScoreboardCached(selectedWeek);
  const hasLiveGames = games.some((game) => game.GameStatus !== "Pregame" && game.GameStatus !== "Final");

  return (
    <>
      <ScoreboardLiveRefresh enabled={hasLiveGames} />
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-5 px-3">
        {games.map((game, index) => {
          const currentKickoff = formatDateForKickoff(game.GameKickoff);
          const previousGame = games[index - 1];
          const previousKickoff = previousGame ? formatDateForKickoff(previousGame.GameKickoff) : undefined;
          const differentKickoff = currentKickoff !== previousKickoff;
          const isFirst = index === 0;

          return (
            <Fragment key={`game-${game.GameID}`}>
              {differentKickoff && <ScoreboardDate isFirst={isFirst} kickoff={game.GameKickoff} />}
              <div className="mb-3">
                <div className={cn("p-3 flex bg-gray-100 border border-gray-500")}>
                  <div className={cn("flex shrink flex-wrap")}>
                    <ScoreboardTeam
                      gameStatus={game.GameStatus}
                      hasPossession={game.GameHasPossession === game.HomeTeamID}
                      isInRedzone={game.GameInRedzone === game.HomeTeamID}
                      isWinner={game.WinnerTeamID === game.HomeTeamID}
                      score={game.GameHomeScore}
                      team={game.homeTeam}
                    />
                    <ScoreboardTeam
                      gameStatus={game.GameStatus}
                      hasPossession={game.GameHasPossession === game.VisitorTeamID}
                      isInRedzone={game.GameInRedzone === game.VisitorTeamID}
                      isWinner={game.WinnerTeamID === game.VisitorTeamID}
                      score={game.GameVisitorScore}
                      team={game.visitorTeam}
                    />
                  </div>
                  <div className={cn("text-right pr-4 text-nowrap pt-4 text-lg grow")}>
                    <GameStatusDisplay
                      gameStatus={game.GameStatus}
                      kickoff={game.GameKickoff}
                      timeLeft={game.GameTimeLeftInQuarter}
                    />
                  </div>
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </>
  );
};

const ScoreboardPageBody: FC<PageProps<"/scoreboard">> = async ({ searchParams }) => {
  const redirectUrl = await requireRegistered();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const selectedWeek = await getSelectedWeekFromParams(searchParams);

  return (
    <PageTransition>
      <div className="h-full flex flex-col md:mx-3">
        <CustomHead title={TITLE} />
        <PageContent className="pt-5 md:pt-3 pb-4">
          <RetryableSection title="the scoreboard">
            <Crossfade>
              <ScoreboardGames selectedWeek={selectedWeek} />
            </Crossfade>
          </RetryableSection>
        </PageContent>
      </div>
    </PageTransition>
  );
};

const Scoreboard: FC<PageProps<"/scoreboard">> = (props) => (
  <Suspense fallback={<ScoreboardLoader />}>
    <ScoreboardPageBody {...props} />
  </Suspense>
);

export default Scoreboard;
