'use client';

import type { FC } from 'react';

import { writeLog } from "@/server/actions/logs";

type Props = {
  href: string;
  userId?: number;
};

const SlackLink: FC<Props> = ({ href, userId }) => {
  const logSlackClick = async (): Promise<void> => {
    try {
      await writeLog({
        LogAction: "SLACK",
        LogMessage: null,
        LogData: null,
        userId,
      });
    } catch (error) {
      console.error({ text: "Error when writing log for slack link click: ", error });
    }
  };

  return (
    <a className="underline text-sky-600" href={href} onClick={logSlackClick} target="slack">
      Join our Slack
    </a>
  );
};

export default SlackLink;
