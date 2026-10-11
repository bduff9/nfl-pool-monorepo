export type TeamColors = {
  TeamCity: string;
  TeamName: string;
  TeamPrimaryColor: string;
  TeamSecondaryColor: string;
};

const TeamBadge = ({ team }: { team: TeamColors }) => (
  <span className="px-1.5" style={{ backgroundColor: team.TeamPrimaryColor, color: team.TeamSecondaryColor }}>
    {team.TeamCity} {team.TeamName}
  </span>
);

export default TeamBadge;
