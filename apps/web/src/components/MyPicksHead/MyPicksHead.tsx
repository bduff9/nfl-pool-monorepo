import type { FC } from "react";

import { getWeekStatus } from "@/server/loaders/week";
import { getMyWeeklyRank } from "@/server/loaders/weeklyMv";

import MyProgressChart from "../MyProgressChart/MyProgressChart";

type Props = {
  week: number;
};

const MyPicksHead: FC<Props> = async ({ week }) => {
  const weekStatusPromise = getWeekStatus(week);
  const myWeeklyRankPromise = getMyWeeklyRank(week);

  const [weekStatus, myWeeklyRank] = await Promise.all([weekStatusPromise, myWeeklyRankPromise]);

  if (!myWeeklyRank) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-x-6">
      <div className="col-span-full md:col-span-2 pb-3">
        <div className="bg-gray-100/80 rounded px-3 pt-2 h-full">
          <h5 className="text-center mb-0">Current Score</h5>
          <MyProgressChart
            correct={myWeeklyRank.PointsEarned}
            correctLabel="Your Current Score"
            isOver={weekStatus === "Complete"}
            max={myWeeklyRank.PointsTotal}
            maxLabel="Max Score"
            possible={myWeeklyRank.PointsPossible}
            possibleLabel="Your Max Possible Score"
          />
        </div>
      </div>
      <div className="col-span-full md:col-span-2 pb-3">
        <div className="bg-gray-100/80 rounded px-3 pt-2 h-full">
          <h5 className="text-center mb-0">Games Correct</h5>
          <MyProgressChart
            correct={myWeeklyRank.GamesCorrect}
            correctLabel="Your Correct Games"
            isOver={weekStatus === "Complete"}
            max={myWeeklyRank.GamesTotal}
            maxLabel="Max Games"
            possible={myWeeklyRank.GamesPossible}
            possibleLabel="Your Max Possible Games"
          />
        </div>
      </div>
      <div className="pb-3">
        <div className="bg-gray-100/80 rounded text-center px-3 pt-2 h-full">
          <h5 className="px-2 h-12">My Tiebreaker</h5>
          <div className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
            {myWeeklyRank.TiebreakerScore}
          </div>
        </div>
      </div>
      <div className="pb-3">
        <div className="bg-gray-100/80 rounded text-center px-3 pt-2 h-full">
          <h5 style={{ height: "3rem" }}>Final Game Total</h5>
          <div className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
            {myWeeklyRank.LastScore}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPicksHead;
