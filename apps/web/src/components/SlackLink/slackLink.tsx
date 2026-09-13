"use client";

import type { FC } from "react";

import { writeLog } from "@/server/actions/logs";

type Props = {
  href: string;
};

const SlackLink: FC<Props> = ({ href }) => {
  const logSlackClick = async (): Promise<void> => {
    try {
      await writeLog({
        LogAction: "SLACK",
        LogData: null,
        LogMessage: null,
      });
    } catch (error) {
      console.error({
        error,
        text: "Error when writing log for slack link click: ",
      });
    }
  };

  return (
    <a className="underline text-sky-600" href={href} onClick={logSlackClick} target="slack">
      Join our Slack
    </a>
  );
};

export default SlackLink;
