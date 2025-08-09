export const addOrdinal = (n: number): string => {
  const remainder10 = n % 10;
  const remainder100 = n % 100;

  if (remainder10 === 1 && remainder100 !== 11) return `${n}st`;

  if (remainder10 === 2 && remainder100 !== 12) return `${n}nd`;

  if (remainder10 === 3 && remainder100 !== 13) return `${n}rd`;

  return `${n}th`;
};

export const get2DigitNumber = (value: number): string => `${value}`.padStart(2, "0");

export const getRandomInteger = (from = 0, to = 10): number => {
  if (to <= from) {
    console.error({ from, text: "Invalid to passed in: ", to });

    return 0;
  }

  return Math.floor(Math.random() * (to - from)) + from;
};
