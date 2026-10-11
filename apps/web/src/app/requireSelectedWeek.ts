import { redirect } from "next/navigation";

import { requireRegistered } from "@/lib/auth";
import { getSelectedWeekFromParams } from "@/server/loaders/week";

export const requireSelectedWeek = async (searchParams: Parameters<typeof getSelectedWeekFromParams>[0]) => {
  const redirectUrl = await requireRegistered();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  return getSelectedWeekFromParams(searchParams);
};
