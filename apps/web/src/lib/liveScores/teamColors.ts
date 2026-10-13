type TeamColors = { TeamPrimaryColor: string; TeamSecondaryColor: string } | null;

export type MatchupColors = { home: string; visitor: string };

// The scoreboard cards are always the dark muted surface (about #262626)
const CARD_BACKGROUND = "#262626";
// Below this contrast against the card a color reads as a smudge (navy, black, maroon); team reds sit just above it
const MIN_CONTRAST = 1.6;
// RGB distance under which two team colors look like the same color side by side
const MIN_DISTANCE = 90;
const FALLBACK_COLOR = "#a3a3a3";

const parseHex = (hex: string): [number, number, number] => {
  const digits = hex.replace("#", "");
  const full = digits.length === 3 ? [...digits].map((digit) => digit + digit).join("") : digits;
  const value = Number.parseInt(full, 16);

  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const toLinear = (channel: number): number => {
  const scaled = channel / 255;

  return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string): number => {
  const [r, g, b] = parseHex(hex).map(toLinear) as [number, number, number];

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrastWithCard = (hex: string): number => {
  const [lighter, darker] = [luminance(hex), luminance(CARD_BACKGROUND)].sort((a, b) => b - a) as [number, number];

  return (lighter + 0.05) / (darker + 0.05);
};

const distance = (a: string, b: string): number => {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);

  return Math.hypot(ar - br, ag - bg, ab - bb);
};

const isVisible = (hex: string): boolean => contrastWithCard(hex) >= MIN_CONTRAST;

// A team's colors in preference order, keeping only the ones that show up on the card
const getVisibleColors = (team: TeamColors): string[] => {
  const colors = team ? [team.TeamPrimaryColor, team.TeamSecondaryColor].filter(isVisible) : [];

  return colors.length ? colors : [FALLBACK_COLOR];
};

/**
 * Picks one color per team for charts on the dark scoreboard card: the primary color unless it is too dark to see,
 * then the secondary. When both teams land on similar colors, the visitor switches to its other visible color.
 */
export const getMatchupColors = (homeTeam: TeamColors, visitorTeam: TeamColors): MatchupColors => {
  const [home = FALLBACK_COLOR] = getVisibleColors(homeTeam);
  const visitorOptions = getVisibleColors(visitorTeam);
  const visitor = visitorOptions.find((color) => distance(color, home) >= MIN_DISTANCE) ?? visitorOptions[0];

  return { home, visitor: visitor ?? FALLBACK_COLOR };
};
