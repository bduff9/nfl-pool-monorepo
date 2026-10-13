export type Sparkline = {
  endX: number;
  endY: number;
  /** y of the 50% line. */
  midY: number;
  /** SVG polyline `points`, oldest first. */
  points: string;
};

const round = (value: number): number => Math.round(value * 10) / 10;

/**
 * Lays home win probabilities (0-100, oldest first) out in a `width` x `height` box with 100% at the top.
 * Returns undefined when there are too few points to draw a line.
 */
export const buildSparkline = (values: number[], width: number, height: number): Sparkline | undefined => {
  if (values.length < 2) {
    return undefined;
  }

  const step = width / (values.length - 1);
  const toY = (percent: number): number => round(height - (Math.min(100, Math.max(0, percent)) / 100) * height);
  const coordinates = values.map((value, index) => ({ x: round(index * step), y: toY(value) }));
  const last = coordinates[coordinates.length - 1];

  return {
    endX: last?.x ?? width,
    endY: last?.y ?? toY(50),
    midY: toY(50),
    points: coordinates.map(({ x, y }) => `${x},${y}`).join(" "),
  };
};
