"use client";

import { usePathname } from "next/navigation";
import type { FC } from "react";
import { useEffect } from "react";

import { writeLog } from "@/server/actions/logs";

const Write404Log: FC = () => {
  const path = usePathname();

  useEffect(() => {
    writeLog({
      LogAction: "404",
      LogData: null,
      LogMessage: path,
    });
  }, [path]);

  return null;
};

export default Write404Log;
