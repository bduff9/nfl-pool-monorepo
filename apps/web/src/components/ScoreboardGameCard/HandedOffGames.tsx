"use client";

import { useParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { type FC, type ReactNode, useLayoutEffect, useSyncExternalStore } from "react";

import { HandedOffAlerts } from "@/components/CustomHead/CustomHead.client";
import PageContent from "@/components/PageContent/PageContent";
import ScoreboardGamesList from "@/components/ScoreboardGamesList/ScoreboardGamesList";
import SharedElement from "@/components/ViewTransitions/SharedElement";
import { getGameTransitionName } from "@/lib/gameTransitionNames";
import { weekParser } from "@/lib/weekParser";

import ScoreboardGameCard from "./ScoreboardGameCard";
import ScoreboardGameCardSkeleton from "./ScoreboardGameCardSkeleton";
import {
  findHandedOffGame,
  getHandedOffWeek,
  getScoreboardGamesSnapshot,
  getScoreboardScroll,
  getServerScoreboardGamesSnapshot,
  subscribeScoreboardGames,
} from "./scoreboardHandoff";

const useHandedOffGames = () =>
  useSyncExternalStore(subscribeScoreboardGames, getScoreboardGamesSnapshot, getServerScoreboardGamesSnapshot);

/**
 * Loading state of the game page's card: the card the scoreboard last showed for this game, filled, so the tapped
 * card moves up into place with its content. Without one (a deep link or a refresh), an empty card with the game's
 * view transition name.
 */
export const HandedOffGameCard: FC<{ eventId: string }> = ({ eventId }) => {
  const game = findHandedOffGame(useHandedOffGames(), eventId);

  if (game) {
    return (
      <div className="mb-3">
        <ScoreboardGameCard game={game} />
      </div>
    );
  }

  return (
    <SharedElement name={getGameTransitionName(eventId)}>
      <ScoreboardGameCardSkeleton />
    </SharedElement>
  );
};

/**
 * HandedOffGameCard for the game in the URL, for the page-level fallback, which renders before the page can read its
 * params. useParams suspends while prerendering (the event id is only known per request), so render this inside a
 * Suspense whose fallback is ScoreboardGameCardSkeleton.
 */
export const RouteHandedOffGameCard: FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  return <HandedOffGameCard eventId={eventId} />;
};

const HandedOffScoreboardList: FC<{ games: Parameters<typeof ScoreboardGamesList>[0]["games"] }> = ({ games }) => {
  // Back where the user left the list, before the view transition captures it, so the game page's card has its row
  // on screen to move into (a pair whose target is off screen does not animate). The back link does not scroll.
  useLayoutEffect(() => {
    window.scrollTo(0, getScoreboardScroll());
  }, []);

  return (
    <div className="h-full flex flex-col md:mx-3">
      <HandedOffAlerts />
      <PageContent className="pt-5 md:pt-3 pb-4">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-5 px-3">
          <ScoreboardGamesList games={games} />
        </div>
      </PageContent>
    </div>
  );
};

/**
 * Loading state of the scoreboard: the list it last showed for the week in the URL, laid out like the page and
 * scrolled where the user left it, so a game page's card moves back down into its row. Shows `fallback` otherwise.
 * The week comes from the URL, which suspends while prerendering, so render this inside a Suspense whose fallback is
 * `fallback` too.
 */
export const HandedOffScoreboard: FC<{ fallback: ReactNode }> = ({ fallback }) => {
  const [week] = useQueryState("week", weekParser);
  const games = getHandedOffWeek(useHandedOffGames(), week);

  return games ? <HandedOffScoreboardList games={games} /> : fallback;
};
