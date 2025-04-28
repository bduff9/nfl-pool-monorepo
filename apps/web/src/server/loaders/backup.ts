import { env } from '@/lib/env';
import { BlobServiceClient } from '@azure/storage-blob';
import { cache } from 'react';
import 'server-only';

type Backup = {
	backupName: string;
	backupDate: Date;
	backupWhen: 'AM' | 'PM';
};

export const getAdminBackups = cache(async () => {
	const backups: Backup[] = [];
	const blobServiceClient = BlobServiceClient.fromConnectionString(env.AzureWebJobsStorage);
	const containerClient = blobServiceClient.getContainerClient(env.containerName);

	for await (const blob of containerClient.listBlobsFlat()) {
		const name = blob.name;
		const parts = name.split('-');

		parts.splice(0, 1);

		const amPm = parts.splice(parts.length - 1, 1)[0]?.replace('.sql', '') as 'AM' | 'PM';
		const date = new Date(parts.join('-'));
		const backup: Backup = {
			backupDate: date,
			backupName: name,
			backupWhen: amPm,
		};

		backups.push(backup);
	}

	return { count: backups.length, results: backups };
});
