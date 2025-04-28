'use server';

import { restoreBackupSchema, serverActionResultSchema } from "@/lib/zod";
import { authedProcedure } from "@/lib/zsa.server";
import 'server-only';

export const restoreBackup = authedProcedure
	.input(restoreBackupSchema)
	.output(serverActionResultSchema)
	.handler(async ({ input }) => {
		const { backupName } = input;

		//TODO: implement this function
		await Promise.resolve(backupName);

		return {
			metadata: {},
			status: 'Success',
		};
	});
