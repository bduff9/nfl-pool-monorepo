import * as React from "react";
import { Text } from "react-email";

import TeamBadge, { type TeamColors } from "./TeamBadge";

type Props = {
  homeTeam: TeamColors;
  status: "ended" | "started";
  userFirstName: string;
  visitorTeam: TeamColors;
  week: number;
};

const WeekMatchupIntro = ({ homeTeam, status, userFirstName, visitorTeam, week }: Props) => (
  <React.Fragment>
    <Text className="text-xl">Hello {userFirstName},</Text>

    <Text className="text-lg">
      Week {week}
      {` has just ${status} with:`}
      <br />
      <TeamBadge team={visitorTeam} />@<TeamBadge team={homeTeam} />
    </Text>
  </React.Fragment>
);

export default WeekMatchupIntro;
