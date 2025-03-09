'use client';

import type { FC } from 'react';

import { writeLog } from '@/actions/logs';
import { logger } from '@/utils/logging';

type Props = {
	href: string;
};

const SlackLink: FC<Props> = ({ href }) => {
	const logSlackClick = async (): Promise<void> => {
		try {
			await writeLog({
				LogAction: 'SLACK',
				LogMessage: null,
				LogData: null,
			});
		} catch (error) {
			logger.error({ text: 'Error when writing log for slack link click: ', error });
		}
	};

	return (
		<a href={href} onClick={logSlackClick} target="slack">
			Join our Slack
		</a>
	);
};

export default SlackLink;
