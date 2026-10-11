type OverallRank = { Rank?: number | null; Tied?: unknown } | undefined;

export const getOverallPlacement = (
  myOverallRank: OverallRank,
  overallTotalCount: number,
  overallTiedCount: number,
) => {
  const myPlace = `${myOverallRank?.Tied ? "T" : ""}${myOverallRank?.Rank}`;
  const me = myOverallRank?.Rank ?? 0;

  return {
    aheadOfMe: me - 1,
    behindMe: overallTotalCount - me - overallTiedCount,
    myPlace,
  };
};

export const getOverallPieData = (
  myPlace: string,
  overallTotalCount: number,
  aheadOfMe: number,
  behindMe: number,
  overallTiedCount: number,
) => [
  { fill: "var(--color-red-700)", myPlace, name: "ahead of me", total: overallTotalCount, value: aheadOfMe },
  { fill: "var(--color-green-700)", myPlace, name: "behind me", total: overallTotalCount, value: behindMe },
  { fill: "var(--color-amber-600)", myPlace, name: "tied with me", total: overallTotalCount, value: overallTiedCount },
];
