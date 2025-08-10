import { db } from "../kysely";

export const signOutUserFromAllDevices = async (userId: number): Promise<void> => {
  await db.deleteFrom("Sessions").where("UserID", "=", userId).executeTakeFirstOrThrow();
};
