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
import { Fragment } from "react";

import CustomHead from "@/components/CustomHead/CustomHead";
import GameStatusDisplay from "@/components/GameStatusDisplay/GameStatusDisplay";
import ScoreboardDate from "@/components/ScoreboardDate/ScoreboardDate";
import ScoreboardTeam from "@/components/ScoreboardTeam/ScoreboardTeam";
import { requireRegistered } from "@/lib/auth";
import { formatDateForKickoff } from "@/lib/dates";
import type { NP } from "@/lib/types";
import { getGamesForWeekCached } from "@/server/loaders/game";
import { getSelectedWeek } from "@/server/loaders/week";

const TITLE = "Scoreboard";

export const metadata: Metadata = {
  title: TITLE,
};

const Scoreboard: NP = async () => {
  const redirectUrl = await requireRegistered();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const selectedWeek = await getSelectedWeek();
  const games = await getGamesForWeekCached(selectedWeek);
  let lastKickoff: string;

  return (
    <div className="h-full flex flex-col">
      <CustomHead title={TITLE} />
      <div className="bg-gray-100/80 text-black md:mx-2 pt-5 md:pt-3 min-h-screen pb-4 flex-1">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-5 px-3">
          {games.map((game) => {
            const currentKickoff = formatDateForKickoff(game.GameKickoff);
            const differentKickoff = currentKickoff !== lastKickoff;
            const isFirst = !lastKickoff;

            lastKickoff = currentKickoff;

            return (
              <Fragment key={`game-${game.GameID}`}>
                {differentKickoff && <ScoreboardDate isFirst={isFirst} kickoff={game.GameKickoff} />}
                <div className="mb-3">
                  <div className={cn("p-3 flex bg-gray-100 border border-gray-500")}>
                    <div className={cn("flex flex-grow flex-wrap")}>
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
                    <div className={cn("text-center pt-4 text-lg min-w-[320px] md:min-w-[128px]")}>
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
      </div>
    </div>
  );
};

export default Scoreboard;
