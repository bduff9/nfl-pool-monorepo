import type { User } from "@nfl-pool-monorepo/types";

type Viewer = Pick<User, "id" | "name"> | null;
type ViewedEmail = { EmailSubject: string | null; EmailTo: string } | undefined;

const getViewerName = (user: Viewer, email: ViewedEmail) => user?.name ?? email?.EmailTo ?? "Unknown User";

export const buildEmailViewLog = (user: Viewer, email: ViewedEmail, now: Date) => {
  const userName = getViewerName(user, email);

  return {
    LogAction: "VIEW_HTML_EMAIL" as const,
    LogAddedBy: userName,
    LogMessage: `${userName} viewed HTML version of email with subject ${email?.EmailSubject}`,
    LogUpdated: now,
    LogUpdatedBy: userName,
    UserID: user?.id,
  };
};
