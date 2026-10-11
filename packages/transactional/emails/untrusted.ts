import type { Users } from "@nfl-pool-monorepo/db/src";
import { db } from "@nfl-pool-monorepo/db/src/kysely";
import type { Selectable } from "kysely";

import { getAdminNewUserEmailProps } from "../src/adminNewUserEmailProps";
import { deliverEmail } from "./deliverEmail";
import { getHtml, getPlainText, getSubject } from "./templates/UntrustedEmail";

export const sendUntrustedEmail = async (
  newUser: Pick<Selectable<Users>, "UserEmail" | "UserName" | "UserReferredByRaw">,
): Promise<void> => {
  const admins = await db
    .selectFrom("Users")
    .select(["UserFirstName", "UserEmail"])
    .where("UserIsAdmin", "=", 1)
    .execute();

  await Promise.allSettled(
    admins.map((admin) =>
      deliverEmail({
        buildProps: (links) => getAdminNewUserEmailProps(admin, newUser, links),
        getHtml,
        getPlainText,
        label: "untrusted",
        subject: getSubject(),
        to: [admin.UserEmail],
        type: "untrusted",
      }),
    ),
  );
};
