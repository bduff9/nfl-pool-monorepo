import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { cache } from "react";

import { env } from "@/lib/env";

import { parseBackupName } from "./backupParsing";
import "server-only";

const client = new S3Client({
  credentials: { accessKeyId: env.AWS_AK_ID, secretAccessKey: env.AWS_SAK_ID },
  region: env.AWS_R,
});

export const getAdminBackups = cache(async () => {
  const listCommand = new ListObjectsV2Command({
    Bucket: env.BACKUP_BUCKET_NAME,
  });

  const { Contents: blobs } = await client.send(listCommand);
  const backups = (blobs ?? []).flatMap((blob) => {
    const name = blob.Key ?? "";
    const backup = parseBackupName(name);

    if (!backup) {
      console.error("Backup filename did not contain a valid AM/PM segment", { name });
      return [];
    }

    return [backup];
  });

  return { count: backups.length, results: backups };
});
