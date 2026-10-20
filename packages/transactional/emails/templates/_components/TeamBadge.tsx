// biome-ignore lint/style/useImportType: This is needed for react-email
import * as React from "react";

export type TeamColors = {
  TeamCity: string;
  TeamName: string;
  TeamPrimaryColor: string;
  TeamSecondaryColor: string;
};

const TeamBadge: React.FC<{ team: TeamColors }> = ({ team }) => (
  <span className="px-1.5" style={{ backgroundColor: team.TeamPrimaryColor, color: team.TeamSecondaryColor }}>
    {team.TeamCity} {team.TeamName}
  </span>
);

export default TeamBadge;
