import { DummyDriver, Kysely, MysqlAdapter, MysqlIntrospector, MysqlQueryCompiler } from "kysely";
import { describe, expect, it } from "vitest";

import type { DB } from "..";
import { correctPicksQuery, finalGameWinnersQuery, pickCountsQuery, weeklyScoresThroughQuery } from "./recapHelpers";

const db = new Kysely<DB>({
  dialect: {
    createAdapter: () => new MysqlAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (kysely) => new MysqlIntrospector(kysely),
    createQueryCompiler: () => new MysqlQueryCompiler(),
  },
});

describe("recap queries", () => {
  it("reads every weekly score up to the week", () => {
    const { sql, parameters } = weeklyScoresThroughQuery(db, 6).compile();

    expect(sql).toBe("select `UserID`, `UserName`, `Week`, `Rank`, `PointsEarned` from `WeeklyMV` where `Week` <= ?");
    expect(parameters).toEqual([6]);
  });

  it("reads the winners of the week's final games", () => {
    const { sql, parameters } = finalGameWinnersQuery(db, 6).compile();

    expect(sql).toBe(
      "select `g`.`GameID`, `g`.`WinnerTeamID`, `t`.`TeamCity`, `t`.`TeamName` from `Games` as `g` inner join `Teams` as `t` on `t`.`TeamID` = `g`.`WinnerTeamID` where `g`.`GameWeek` = ? and `g`.`GameDeleted` is null and `g`.`GameStatus` = ?",
    );
    expect(parameters).toEqual([6, "Final"]);
  });

  it("counts the picks made on each team of the week", () => {
    const { sql, parameters } = pickCountsQuery(db, 6).compile();

    expect(sql).toBe(
      "select `p`.`GameID`, `p`.`TeamID`, count(*) as `picks` from `Picks` as `p` inner join `Games` as `g` on `g`.`GameID` = `p`.`GameID` where `g`.`GameWeek` = ? and `g`.`GameDeleted` is null and `p`.`PickDeleted` is null and `p`.`TeamID` is not null group by `p`.`GameID`, `p`.`TeamID`",
    );
    expect(parameters).toEqual([6]);
  });

  it("reads the correct picks of the week with their points", () => {
    const { sql, parameters } = correctPicksQuery(db, 6).compile();

    expect(sql).toBe(
      "select `p`.`PickPoints`, `t`.`TeamCity`, `t`.`TeamName`, `u`.`UserFirstName`, `u`.`UserLastName` from `Picks` as `p` inner join `Games` as `g` on `g`.`GameID` = `p`.`GameID` and `g`.`WinnerTeamID` = `p`.`TeamID` inner join `Teams` as `t` on `t`.`TeamID` = `p`.`TeamID` inner join `Users` as `u` on `u`.`UserID` = `p`.`UserID` where `g`.`GameWeek` = ? and `g`.`GameDeleted` is null and `p`.`PickDeleted` is null and `p`.`PickPoints` is not null",
    );
    expect(parameters).toEqual([6]);
  });
});
