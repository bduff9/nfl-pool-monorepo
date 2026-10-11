import type { Status } from "@nfl-pool-monorepo/types";

import { getFirstName, getFullName, getLastName } from "@/lib/user";
import type { finishRegistrationSchema } from "@/lib/validation";
import type { getCurrentUser } from "@/server/loaders/user";

type RegistrationUser = Awaited<ReturnType<typeof getCurrentUser>>;
type RegistrationValues = typeof finishRegistrationSchema.infer;

const getPaymentDefaults = (
  user: RegistrationUser,
): Pick<RegistrationValues, "UserPaymentAccount" | "UserPaymentType"> => ({
  UserPaymentAccount: user.UserPaymentAccount ?? "",
  UserPaymentType: user.UserPaymentType ?? "Paypal",
});

const getSurvivorDefault = (user: RegistrationUser, seasonStatus: Status): boolean =>
  seasonStatus !== "Not Started" ? false : user.UserPlaysSurvivor === 1;

const getTeamDefaults = (user: RegistrationUser): Pick<RegistrationValues, "UserReferredByRaw" | "UserTeamName"> => ({
  UserReferredByRaw: user.UserReferredByRaw || "",
  UserTeamName: user.UserTeamName || "",
});

export const getRegistrationDefaults = (user: RegistrationUser, seasonStatus: Status): RegistrationValues => ({
  UserEmail: user.UserEmail,
  UserFirstName: getFirstName(user),
  UserLastName: getLastName(user),
  UserName: getFullName(user),
  UserPlaysSurvivor: getSurvivorDefault(user, seasonStatus),
  ...getPaymentDefaults(user),
  ...getTeamDefaults(user),
});

export const shouldShowUntrustedNotice = (user: RegistrationUser): boolean =>
  !user.UserTrusted && !!user.UserReferredByRaw;
