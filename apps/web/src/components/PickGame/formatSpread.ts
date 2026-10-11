export type SpreadValue = null | number | string | undefined;

const isBlank = (spread: SpreadValue): boolean => spread === null || spread === undefined || spread === "";

const toSpreadNumber = (spread: SpreadValue): null | number => {
  if (isBlank(spread)) {
    return null;
  }

  const value = Number(spread);

  return Number.isNaN(value) ? null : value;
};

// "+3.5" for a positive spread, "-3.5" for a negative one, null when there is no usable spread
export const formatSpread = (spread: SpreadValue): null | string => {
  const value = toSpreadNumber(spread);

  if (value === null) {
    return null;
  }

  return value > 0 ? `+${value}` : `${value}`;
};
