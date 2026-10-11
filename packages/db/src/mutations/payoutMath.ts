const countWinnersPerPlace = (winners: Array<{ Rank: number }>, prizes: Array<number>): Array<number> =>
  winners.reduce(
    (acc, winner) => {
      acc[winner.Rank] = (acc[winner.Rank] ?? 0) + 1;

      return acc;
    },
    prizes.map(() => 0),
  );

const splitPrize = (prize: number, winnerCount: number): number =>
  Math.round((prize / winnerCount + Number.EPSILON) * 100) / 100;

// Adjusts one place in-place: an empty place rolls its prize into the previous place, otherwise the prize is split
// evenly (to the cent) between everyone tied in that place.
const adjustPlace = (adjustedPrizes: Array<number>, places: Array<number>, i: number): void => {
  const place = places[i] as number;

  if (place === 0) {
    adjustedPrizes[i - 1] = (adjustedPrizes[i - 1] ?? 0) + (adjustedPrizes[i] ?? 0);
    adjustedPrizes[i] = 0;
  } else {
    adjustedPrizes[i] = splitPrize(adjustedPrizes[i] ?? 0, place);
  }
};

export const getPrizeAmounts = <T extends Array<number>>(winners: Array<{ Rank: number }>, prizes: T): T => {
  const adjustedPrizes = [...prizes];
  const places = countWinnersPerPlace(winners, prizes);

  for (let i = places.length - 1; i > 0; i--) {
    adjustPlace(adjustedPrizes, places, i);
  }

  return adjustedPrizes as T;
};
