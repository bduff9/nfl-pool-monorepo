type TeamNameParts = { TeamCity: string | null; TeamName: string | null } | null | undefined;

const orEmpty = (value: string | null | undefined) => value ?? "";

export const getTeamLabel = (team: TeamNameParts) => `${orEmpty(team?.TeamCity)} ${orEmpty(team?.TeamName)}`.trim();
