import { db } from "../kysely";

export type HistoryEntry = {
  UserID: number;
  HistoryPlace: number;
  HistoryType: "Overall" | "Survivor" | "Weekly";
  HistoryWeek: null | number;
  HistoryYear: number;
  UserFirstName: string | null;
  UserLastName: string | null;
  UserName: string | null;
};

export const getHistory = async (): Promise<HistoryEntry[]> => {
  return db
    .selectFrom("History")
    .innerJoin("Users as U", "U.UserID", "History.UserID")
    .select([
      "U.UserID",
      "History.HistoryPlace",
      "History.HistoryType",
      "History.HistoryWeek",
      "History.HistoryYear",
      "U.UserFirstName",
      "U.UserLastName",
      "U.UserName",
    ])
    .where("History.HistoryDeleted", "is", null)
    .orderBy("History.HistoryYear desc")
    .orderBy("History.HistoryType")
    .orderBy("History.HistoryWeek asc")
    .orderBy("History.HistoryPlace asc")
    .execute();
};
