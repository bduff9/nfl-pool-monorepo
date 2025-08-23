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
import type { FC } from "react";
import { FaTimesCircle } from "react-icons/fa";

import type { getGamesForWeekCached } from "@/server/loaders/game";
import type { getMyWeeklyPicks } from "@/server/loaders/pick";

type TeamBlockProps = {
  onClose?: (() => void) | undefined;
  spread?: null | number;
  team:
    | Awaited<ReturnType<typeof getMyWeeklyPicks>>[number]["homeTeam"]
    | Awaited<ReturnType<typeof getMyWeeklyPicks>>[number]["visitorTeam"];
};

const TeamBlock: FC<TeamBlockProps> = ({ onClose, spread, team }) => (
  <div className={cn("w-1/2")}>
    <div className={cn("relative border border-black rounded p-3 bg-gray-100")}>
      {onClose && (
        <FaTimesCircle
          className="absolute top-0 end-0 mt-1 me-1 inline-block md:hidden text-red-600"
          onClick={onClose}
        />
      )}
      <h4 className="text-center">
        <span
          className="underline decoration-1 decoration-solid"
          style={{
            color: team?.TeamPrimaryColor,
            textDecorationColor: team?.TeamSecondaryColor,
          }}
        >
          {team?.TeamCity} {team?.TeamName}
        </span>
      </h4>
      <div className="flex">
        <div className="w-full md:w-1/2 text-start">Record:</div>
        <div className="w-full md:w-1/2 text-start md:text-end">
          {team?.record?.wins ?? 0}-{team?.record?.losses ?? 0}-{team?.record?.ties ?? 0}
        </div>
      </div>
      <div className="flex">
        <div className="w-full md:w-1/2 text-start">Division:</div>
        <div className="w-full md:w-1/2 text-start md:text-end">{`${team?.TeamConference} ${team?.TeamDivision}`}</div>
      </div>

      <div className="flex">
        <div className="w-full md:w-1/2 text-start">Spread:</div>
        <div className="w-full md:w-1/2 text-start md:text-end">{spread}</div>
      </div>

      <h5 className="mt-2 text-center">Rankings</h5>
      <div className="flex">
        <div className="w-full md:w-1/2 text-start">Rushing Offense:</div>
        <div className="w-full md:w-1/2 text-start md:text-end">{team?.TeamRushOffenseRank}</div>
      </div>
      <div className="flex">
        <div className="w-full md:w-1/2 text-start">Passing Offense:</div>
        <div className="w-full md:w-1/2 text-start md:text-end">{team?.TeamPassOffenseRank}</div>
      </div>
      <div className="flex">
        <div className="w-full md:w-1/2 text-start">Rushing Defense:</div>
        <div className="w-full md:w-1/2 text-start md:text-end">{team?.TeamRushDefenseRank}</div>
      </div>
      <div className="flex">
        <div className="w-full md:w-1/2 text-start">Passing Defense:</div>
        <div className="w-full md:w-1/2 text-start md:text-end">{team?.TeamPassDefenseRank}</div>
      </div>
      {(team?.teamHistory?.length ?? 0) > 0 && <h5 className="mt-2 text-center">History</h5>}
      {team?.teamHistory.map((game) => {
        const won = game.WinnerTeamID === team.TeamID;
        const isHome = game.HomeTeamID === team.TeamID;
        const lost = isHome ? game.WinnerTeamID === game.VisitorTeamID : game.WinnerTeamID === game.HomeTeamID;

        return (
          <div className="flex flex-col" key={`history-for-game-${game.GameID}`}>
            <div className="w-full md:w-1/2 text-start">
              Wk {game.GameWeek} {isHome ? "vs" : "@"} {isHome ? game.visitorTeamShortName : game.homeTeamShortName}
            </div>
            <div
              className={cn("w-full md:w-1/2 text-start md:text-end", won && "text-green-500", lost && "text-red-600")}
            >
              {won ? "W" : lost ? "L" : "T"} ({isHome ? game.GameHomeScore : game.GameVisitorScore}-
              {isHome ? game.GameVisitorScore : game.GameHomeScore})
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

type TeamDetailProps = {
  game: Awaited<ReturnType<typeof getGamesForWeekCached>>[number];
  onClose?: (() => void) | undefined;
};

const TeamDetail: FC<TeamDetailProps> = ({ game, onClose }) => {
  return (
    <div className="flex">
      <TeamBlock onClose={onClose} spread={Number(game.GameVisitorSpread)} team={game.visitorTeam} />
      <TeamBlock onClose={onClose} spread={Number(game.GameHomeSpread)} team={game.homeTeam} />
    </div>
  );
};

export default TeamDetail;
