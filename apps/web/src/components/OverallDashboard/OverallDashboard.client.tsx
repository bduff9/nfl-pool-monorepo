'use client';

import 'client-only';
import { motion } from 'framer-motion';
import type { FC } from 'react';

export const OverallDashboardTitle: FC = () => {
	return (
		<motion.h2 className="mb-0" layoutId="overallRankTitle">
			Overall Rank
		</motion.h2>
	);
};

type OverallDashboardResultsProps = {
	className: string;
};

export const OverallDashboardResults: FC<OverallDashboardResultsProps> = ({
	className,
}) => {
	return (
		<motion.h2 className={className} layoutId="myOverallResultsTitle">
			My Overall Results
		</motion.h2>
	);
};
