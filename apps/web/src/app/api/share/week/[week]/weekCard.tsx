import type { ReactElement } from "react";

export type WeekCardData = {
  week: number;
  teamName: string;
  rankLabel: string;
  pointsEarned: number;
  gamesCorrect: number;
  gamesTotal: number;
};

const AMBER = "#ff9a3c";
const CREAM = "#ffd9a6";
const BACKGROUND = "#07080a";
const MUTED = "#9a8c7a";

const Football = (): ReactElement => (
  <svg
    aria-label="Football"
    fill="none"
    height="170"
    role="img"
    stroke={AMBER}
    strokeLinecap="round"
    strokeWidth="6"
    viewBox="0 0 120 120"
    width="170"
  >
    <ellipse cx="60" cy="60" rx="52" ry="30" transform="rotate(-35 60 60)" />
    <path d="M42 78 L78 42" />
    <path d="M50 70 L46 66 M58 62 L54 58 M66 54 L62 50 M74 46 L70 42" stroke={CREAM} />
  </svg>
);

const Stat = ({ label, value }: { label: string; value: string }): ReactElement => (
  <div style={{ alignItems: "center", display: "flex", flexDirection: "column", width: 400 }}>
    <div style={{ color: CREAM, display: "flex", fontSize: 120, fontWeight: 800, lineHeight: 1 }}>{value}</div>
    <div style={{ color: MUTED, display: "flex", fontSize: 34, letterSpacing: 6, marginTop: 16 }}>{label}</div>
  </div>
);

export const WeekResultCard = ({
  week,
  teamName,
  rankLabel,
  pointsEarned,
  gamesCorrect,
  gamesTotal,
}: WeekCardData): ReactElement => (
  <div
    style={{
      alignItems: "center",
      background: `radial-gradient(circle at 50% 38%, #2a1805 0%, ${BACKGROUND} 62%)`,
      border: `6px solid ${AMBER}`,
      color: CREAM,
      display: "flex",
      flexDirection: "column",
      height: "100%",
      justifyContent: "space-between",
      padding: "70px 60px",
      width: "100%",
    }}
  >
    <div style={{ alignItems: "center", display: "flex", flexDirection: "column" }}>
      <Football />
      <div
        style={{
          color: AMBER,
          display: "flex",
          fontSize: 110,
          fontWeight: 800,
          letterSpacing: 8,
          marginTop: 10,
          textShadow: `0 0 40px ${AMBER}`,
        }}
      >
        {`WEEK ${week}`}
      </div>
      <div style={{ color: CREAM, display: "flex", fontSize: 48, marginTop: 14, textAlign: "center" }}>{teamName}</div>
    </div>
    <div style={{ alignItems: "center", display: "flex", flexDirection: "column" }}>
      <div style={{ color: MUTED, display: "flex", fontSize: 34, letterSpacing: 6 }}>FINISHED</div>
      <div style={{ color: AMBER, display: "flex", fontSize: 150, fontWeight: 800, lineHeight: 1.1 }}>{rankLabel}</div>
    </div>
    <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <Stat label="POINTS" value={String(pointsEarned)} />
      <Stat label="CORRECT" value={`${gamesCorrect}/${gamesTotal}`} />
    </div>
    <div style={{ color: AMBER, display: "flex", fontSize: 34, letterSpacing: 4 }}>ASWNN · NFL Confidence Pool</div>
  </div>
);
