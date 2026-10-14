import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type FC, Suspense } from "react";
import "server-only";

import { requireSelectedWeek } from "@/app/requireSelectedWeek";
import CustomHead from "@/components/CustomHead/CustomHead";
import GameDetailSkeleton, { LiveGameDetailSkeleton } from "@/components/LiveGameDetail/GameDetailSkeleton";
import LiveGameDetail from "@/components/LiveGameDetail/LiveGameDetail";
import PageContent from "@/components/PageContent/PageContent";
import { HandedOffGameCard } from "@/components/ScoreboardGameCard/HandedOffGames";
import ScoreboardGameCard from "@/components/ScoreboardGameCard/ScoreboardGameCard";
import ScoreboardLiveRefresh from "@/components/ScoreboardLiveRefresh/ScoreboardLiveRefresh";
import PageTransition from "@/components/ViewTransitions/PageTransition";
import SuspenseReveal from "@/components/ViewTransitions/SuspenseReveal";
import { WeekLink } from "@/components/WeekLink/WeekLink";
import { getGamesForWeekScoreboardCached } from "@/server/loaders/game";
import { getGameTeamsForHeader } from "@/server/loaders/gameTeams";
import { getLiveGameSummary, shouldPollSummary } from "@/server/loaders/liveGameSummary";
import { getScoreboardGames } from "@/server/loaders/scoreboardGames";

const TITLE = "Game Details";
// ESPN event ids are plain numbers
const EVENT_ID_PATTERN = /^\d{1,12}$/;

export const metadata: Metadata = {
  title: TITLE,
};

type GameSectionProps = { eventId: string };

// The same card the scoreboard shows for this game, from the same cached data, so it usually arrives well before
// the ESPN summary and the card moves between the two pages
const GameCard: FC<GameSectionProps & { week: number }> = async ({ eventId, week }) => {
  const games = await getScoreboardGames(await getGamesForWeekScoreboardCached(week), week);
  const game = games.find((weekGame) => weekGame.espnEventId === eventId);

  return game ? (
    <div className="mb-3">
      <ScoreboardGameCard game={game} priority />
    </div>
  ) : null;
};

const GameDetail: FC<GameSectionProps> = async ({ eventId }) => {
  const summary = await getLiveGameSummary(eventId);
  const teams = await getGameTeamsForHeader(summary?.header);

  return (
    <>
      <ScoreboardLiveRefresh enabled={shouldPollSummary(summary)} />
      <LiveGameDetail summary={summary} teams={teams} />
    </>
  );
};

const GamePageBody: FC<PageProps<"/scoreboard/game/[eventId]">> = async ({ params, searchParams }) => {
  // Guards access like the scoreboard; the back link keeps the selected week from the URL
  const week = await requireSelectedWeek(searchParams);
  const { eventId } = await params;

  if (!EVENT_ID_PATTERN.test(eventId)) {
    notFound();
  }

  return (
    <div className="h-full flex flex-col md:mx-3">
      <CustomHead title={TITLE} />
      <PageContent className="pt-5 md:pt-3 pb-4">
        <div className="px-3">
          {/* No scroll reset: the scoreboard returns to where the user left it, see HandedOffScoreboard */}
          <WeekLink className="inline-block py-2.5" href="/scoreboard" scroll={false}>
            &laquo; Back to Scoreboard
          </WeekLink>
          {/* The scoreboard's grid, so the card is the same size as on the scoreboard and only moves between them; on
              wider screens LiveGameDetail puts the win probability chart beside it */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
            <Suspense fallback={<HandedOffGameCard eventId={eventId} />}>
              <GameCard eventId={eventId} week={week} />
            </Suspense>
            <Suspense fallback={<LiveGameDetailSkeleton />}>
              <GameDetail eventId={eventId} />
            </Suspense>
          </div>
        </div>
      </PageContent>
    </div>
  );
};

const GamePage: FC<PageProps<"/scoreboard/game/[eventId]">> = (props) => (
  <PageTransition>
    <SuspenseReveal fallback={<GameDetailSkeleton />}>
      <GamePageBody {...props} />
    </SuspenseReveal>
  </PageTransition>
);

export default GamePage;
