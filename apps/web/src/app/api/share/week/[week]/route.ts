import { ImageResponse } from "next/og";
import { type NextRequest, NextResponse } from "next/server";

import { formatRankLabel } from "@/lib/share/shareText";
import { parseWeekParam } from "@/lib/weekSearchParams";
import { getCurrentSession } from "@/server/loaders/sessions";
import { getMyWeeklyRank, getWeeklyMvCount } from "@/server/loaders/weeklyMv";

import { type WeekCardData, WeekResultCard } from "./weekCard";

const CARD_SIZE = 1080;
const NO_STORE = { "Cache-Control": "private, no-store" };

const loadCardData = async (weekParam: string): Promise<WeekCardData | null> => {
  const week = parseWeekParam(weekParam);

  if (!week) {
    return null;
  }

  const [myRank, total] = await Promise.all([getMyWeeklyRank(week), getWeeklyMvCount(week)]);

  if (!myRank) {
    return null;
  }

  return {
    gamesCorrect: myRank.GamesCorrect,
    gamesTotal: myRank.GamesTotal,
    pointsEarned: myRank.PointsEarned,
    rankLabel: formatRankLabel(myRank.Rank, total, myRank.Tied === 1),
    teamName: myRank.TeamName,
    week,
  };
};

export const GET = async (_req: NextRequest, ctx: RouteContext<"/api/share/week/[week]">) => {
  const { user } = await getCurrentSession();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { headers: NO_STORE, status: 401 });
  }

  const card = await loadCardData((await ctx.params).week);

  if (!card) {
    return NextResponse.json({ error: "Not found" }, { headers: NO_STORE, status: 404 });
  }

  return new ImageResponse(WeekResultCard(card), { headers: NO_STORE, height: CARD_SIZE, width: CARD_SIZE });
};
