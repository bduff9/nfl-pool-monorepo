import type { Users } from "@nfl-pool-monorepo/db/src";
import type { Selectable } from "kysely";

type Admin = Pick<Selectable<Users>, "UserEmail" | "UserFirstName">;
type NewUser = Pick<Selectable<Users>, "UserEmail" | "UserName" | "UserReferredByRaw">;

export type AdminNewUserEmailProps = {
  adminUserFirstName: string;
  browserLink: string;
  newUserUserEmail: string;
  newUserUserName: string;
  newUserUserReferredByRaw: string;
  unsubscribeLink: string;
};

export const getAdminNewUserEmailProps = (
  admin: Admin,
  newUser: NewUser,
  links: { browserLink: string; unsubscribeLink: string },
): AdminNewUserEmailProps => ({
  adminUserFirstName: admin.UserFirstName ?? "",
  browserLink: links.browserLink,
  newUserUserEmail: newUser.UserEmail,
  newUserUserName: newUser.UserName ?? "",
  newUserUserReferredByRaw: newUser.UserReferredByRaw ?? "",
  unsubscribeLink: links.unsubscribeLink,
});

export const getNewUserEmailProps = (
  baseProps: AdminNewUserEmailProps,
  newUser: Pick<Selectable<Users>, "UserTeamName">,
  history: { isReturning: boolean; yearsPlayed: string },
): AdminNewUserEmailProps & { isReturning: boolean; newUserUserTeamName: string; yearsPlayed: string } => ({
  ...baseProps,
  isReturning: history.isReturning,
  newUserUserTeamName: newUser.UserTeamName ?? "",
  yearsPlayed: history.yearsPlayed,
});
