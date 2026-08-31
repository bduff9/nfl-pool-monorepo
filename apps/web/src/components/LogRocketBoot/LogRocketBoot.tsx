"use client";

import type { User } from "@nfl-pool-monorepo/types";
import type { FC } from "react";

import { useLogrocket } from "@/lib/hooks/useLogRocket";

type Props = {
  user?: User | null;
};

const LogRocketBoot: FC<Props> = ({ user }) => {
  useLogrocket(user);

  return null;
};

export default LogRocketBoot;
