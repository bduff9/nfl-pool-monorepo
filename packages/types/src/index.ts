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
