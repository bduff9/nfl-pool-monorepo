"use client";
import { usePathname } from "next/navigation";
import type { FC } from "react";
import { useEffect } from "react";

import type { User } from "@/lib/auth";
import { writeLog } from "@/server/actions/logs";

type Props = {
  user: User | null;
};

const Write404Log: FC<Props> = ({ user }) => {
  const path = usePathname();

  useEffect(() => {
    writeLog({
      LogAction: "404",
      LogData: null,
      LogMessage: path,
      userId: user?.id,
    });
  }, [path, user?.id]);

  return null;
};

export default Write404Log;
