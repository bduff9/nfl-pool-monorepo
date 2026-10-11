import Image from "next/image";
import type { FC } from "react";

import { getTeamLabel } from "./teamLabel";

type TeamLogoProps = {
  className?: string;
  priority?: boolean;
  size?: number;
  team: { TeamCity: string | null; TeamLogo: string | null; TeamName: string | null } | null | undefined;
};

const TeamLogo: FC<TeamLogoProps> = ({ className, priority = false, size = 70, team }) => {
  const label = getTeamLabel(team);

  return (
    <Image
      alt={label}
      className={className}
      height={size}
      priority={priority}
      src={`/NFLLogos/${team?.TeamLogo}`}
      title={label}
      width={size}
    />
  );
};

export default TeamLogo;
