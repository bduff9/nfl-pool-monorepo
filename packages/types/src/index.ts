/**
 * Season and week status
 */
export type Status = "Not Started" | "In Progress" | "Complete";

export type User = {
  id: number;
  doneRegistering: number;
  email: string;
  image: string | null;
  isAdmin: number;
  name: string | null;
  playsSurvivor: number;
};

export type KickoffChange = {
  gameID: number;
  newKickoff: Date;
  oldKickoff: Date;
  // The week the game sat in when users made picks on it, not necessarily the new week.
  week: number;
};
