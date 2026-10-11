type WeeklyRank = { Rank: number; Tied: number };

type RankingSlice = {
  fill: string;
  myPlace: string;
  name: string;
  total: number;
  value: number;
};

const formatPlace = (rank: WeeklyRank): string => `${rank.Tied ? "T" : ""}${rank.Rank}`;

export const buildRankingData = (rank: WeeklyRank, totalCount: number, tiedCount: number): Array<RankingSlice> => {
  const myPlace = formatPlace(rank);

  return [
    { fill: "var(--color-red-700)", myPlace, name: "ahead of me", total: totalCount, value: rank.Rank - 1 },
    {
      fill: "var(--color-green-700)",
      myPlace,
      name: "behind me",
      total: totalCount,
      value: totalCount - rank.Rank - tiedCount,
    },
    { fill: "var(--color-amber-600)", myPlace, name: "tied with me", total: totalCount, value: tiedCount },
  ];
};
