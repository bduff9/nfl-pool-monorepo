type PickOutcome = "lost" | "pending" | "won";

const ROW_CLASSES = { lost: "bg-red-300", pending: "", won: "bg-green-200" } as const;
const POINTS_CLASSES = { lost: "text-red-900 line-through", pending: "", won: "text-emerald-900" } as const;

const getPickOutcome = (winnerTeamID: null | number | undefined, teamID: null | number | undefined): PickOutcome => {
  if (!winnerTeamID) return "pending";

  return winnerTeamID === teamID ? "won" : "lost";
};

// Row and points classes for a pick once its game has a winner; nothing while the game is undecided
export const getPickResultClasses = (
  winnerTeamID: null | number | undefined,
  teamID: null | number | undefined,
): { points: string; row: string } => {
  const outcome = getPickOutcome(winnerTeamID, teamID);

  return { points: POINTS_CLASSES[outcome], row: ROW_CLASSES[outcome] };
};
