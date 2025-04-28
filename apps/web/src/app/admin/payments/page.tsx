/*******************************************************************************
 * NFL Confidence Pool FE - the frontend implementation of an NFL confidence pool.
 * Copyright (C) 2015-present Brian Duffey
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see {http://www.gnu.org/licenses/}.
 * Home: https://asitewithnoname.com/
 */

import { cn } from "@nfl-pool-monorepo/utils/styles";
import { redirect } from 'next/navigation';

import CustomHead from "@/components/CustomHead/CustomHead";
import ManageAdminPayouts from "@/components/ManageAdminPayouts/ManageAdminPayouts";
import { requireAdmin } from "@/lib/auth";
import type { NP } from "@/lib/types";
import { getUserPayoutsForAdmin } from "@/server/loaders/payment";

const AdminPaymentsPage: NP = async ({ searchParams }) => {
	const redirectUrl = await requireAdmin();

	if (redirectUrl) {
		return redirect(redirectUrl);
	}

	const results = await getUserPayoutsForAdmin(await searchParams);

	return (
		<div className="h-full flex flex-col">
			<CustomHead title="Manage Payments" />
			<div className={cn('text-black mx-2 flex-1 min-h-screen')}>
				{/* <ManageAdminPayments
					overallPrizes={overallPrizes}
					poolCost={poolCost}
					registeredCount={registeredCount}
					survivorCost={survivorCost}
					survivorCount={survivorCount}
					survivorPrizes={survivorPrizes}
					weeklyPrizes={weeklyPrizes}
				/> */}
				<ManageAdminPayouts winners={results} />
			</div>
		</div>
	);
};

export default AdminPaymentsPage;
