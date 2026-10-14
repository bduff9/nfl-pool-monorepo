import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type FC, Suspense } from "react";
import "server-only";

import { requireSelectedWeek } from "@/app/requireSelectedWeek";
import CustomHead from "@/components/CustomHead/CustomHead";
import LiveGameDetail from "@/components/LiveGameDetail/LiveGameDetail";
import PageContent from "@/components/PageContent/PageContent";
import ScoreboardLiveRefresh from "@/components/ScoreboardLiveRefresh/ScoreboardLiveRefresh";
import PageTransition from "@/components/ViewTransitions/PageTransition";
import { getGameTeamsForHeader } from "@/server/loaders/gameTeams";
import { getLiveGameSummary, shouldPollSummary } from "@/server/loaders/liveGameSummary";

import ScoreboardLoader from "../../loading";

const TITLE = "Game Details";
// ESPN event ids are plain numbers
const EVENT_ID_PATTERN = /^\d{1,12}$/;

export const metadata: Metadata = {
  title: TITLE,
};

const GamePageBody: FC<PageProps<"/scoreboard/game/[eventId]">> = async ({ params, searchParams }) => {
  // Guards access like the scoreboard; the back link keeps the selected week from the URL
  await requireSelectedWeek(searchParams);
  const { eventId } = await params;

  if (!EVENT_ID_PATTERN.test(eventId)) {
    notFound();
  }

  const summary = await getLiveGameSummary(eventId);
  const teams = await getGameTeamsForHeader(summary?.header);

  return (
    <>
      <ScoreboardLiveRefresh enabled={shouldPollSummary(summary)} />
      <div className="h-full flex flex-col md:mx-3">
        <CustomHead title={TITLE} />
        <PageContent className="pt-5 md:pt-3 pb-4">
          <LiveGameDetail summary={summary} teams={teams} />
        </PageContent>
      </div>
    </>
  );
};

const GamePage: FC<PageProps<"/scoreboard/game/[eventId]">> = (props) => (
  <PageTransition>
    <Suspense fallback={<ScoreboardLoader />}>
      <GamePageBody {...props} />
    </Suspense>
  </PageTransition>
);

export default GamePage;
