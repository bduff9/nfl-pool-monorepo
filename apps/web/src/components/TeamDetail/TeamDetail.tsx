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
import type { FC, ReactNode } from "react";
import { FaTimesCircle } from "react-icons/fa";

import type { getGamesForWeekCached } from "@/server/loaders/game";

import {
  getHistoryEntry,
  getRecordLabel,
  getTeamFields,
  type HistoryGame,
  type TeamBlockTeam,
} from "./teamDetailHelpers";

type TeamBlockProps = {
  onClose?: (() => void) | undefined;
  spread?: null | number;
  team: TeamBlockTeam;
};

const StatRow: FC<{ label: string; value: ReactNode }> = ({ label, value }) => (
  <div className="flex">
    <div className="w-full md:w-1/2 text-start">{label}:</div>
    <div className="w-full md:w-1/2 text-start md:text-end">{value}</div>
  </div>
);

const CloseButton: FC<{ onClose?: (() => void) | undefined }> = ({ onClose }) => {
  if (!onClose) return null;

  return (
    <button
      aria-label="Close team details"
      className="absolute top-0 end-0 mt-1 me-1 inline-block md:hidden"
      onClick={onClose}
      type="button"
    >
      <FaTimesCircle className="text-red-600" />
    </button>
  );
};

const TeamHeading: FC<{ team: TeamBlockTeam }> = ({ team }) => {
  const { TeamCity, TeamName, TeamPrimaryColor, TeamSecondaryColor } = getTeamFields(team);

  return (
    <h4 className="text-center">
      <span
        className="underline decoration-1 decoration-solid"
        style={{
          color: TeamPrimaryColor,
          textDecorationColor: TeamSecondaryColor,
        }}
      >
        {TeamCity} {TeamName}
      </span>
    </h4>
  );
};

const TeamOverview: FC<{ spread?: null | number | undefined; team: TeamBlockTeam }> = ({ spread, team }) => {
  const { record, TeamConference, TeamDivision } = getTeamFields(team);

  return (
    <>
      <StatRow label="Record" value={getRecordLabel(record)} />
      <StatRow label="Division" value={`${TeamConference} ${TeamDivision}`} />
      <div className="flex">
        <div className="w-full md:w-1/2 text-start">Spread:</div>
        <div className="w-full md:w-1/2 text-start md:text-end">{spread}</div>
      </div>
    </>
  );
};

const TeamRankings: FC<{ team: TeamBlockTeam }> = ({ team }) => {
  const { TeamPassDefenseRank, TeamPassOffenseRank, TeamRushDefenseRank, TeamRushOffenseRank } = getTeamFields(team);

  return (
    <>
      <h5 className="mt-2 text-center">Rankings</h5>
      <StatRow label="Rushing Offense" value={TeamRushOffenseRank} />
      <StatRow label="Passing Offense" value={TeamPassOffenseRank} />
      <StatRow label="Rushing Defense" value={TeamRushDefenseRank} />
      <StatRow label="Passing Defense" value={TeamPassDefenseRank} />
    </>
  );
};

const HistoryRow: FC<{ game: HistoryGame; teamID: number }> = ({ game, teamID }) => {
  const entry = getHistoryEntry(game, teamID);

  return (
    <div className="flex">
      <div className="w-full md:w-1/2 text-start">
        Wk {game.GameWeek} {entry.prefix} {entry.opponentShortName}
      </div>
      <div className={cn("w-full md:w-1/2 text-start md:text-end", entry.resultClassName)}>
        {entry.resultText} ({entry.ownScore}-{entry.opponentScore})
      </div>
    </div>
  );
};

const TeamHistory: FC<{ team: TeamBlockTeam }> = ({ team }) => {
  const { teamHistory = [], TeamID } = getTeamFields(team);

  return (
    <>
      {teamHistory.length > 0 && <h5 className="mt-2 text-center">History</h5>}
      {teamHistory.map((game) => (
        <HistoryRow game={game} key={`history-for-game-${game.GameID}`} teamID={Number(TeamID)} />
      ))}
    </>
  );
};

const TeamBlock: FC<TeamBlockProps> = ({ onClose, spread, team }) => (
  <div className={cn("w-1/2")}>
    <div className={cn("relative border border-border rounded p-3 bg-muted")}>
      <CloseButton onClose={onClose} />
      <TeamHeading team={team} />
      <TeamOverview spread={spread} team={team} />
      <TeamRankings team={team} />
      <TeamHistory team={team} />
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
