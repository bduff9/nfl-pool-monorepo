import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { cache } from "react";

import { env } from "@/lib/env";
import "server-only";

type Backup = {
  backupName: string;
  backupDate: Date;
  backupWhen: "AM" | "PM";
};

const client = new S3Client({});

export const getAdminBackups = cache(async () => {
  const backups: Backup[] = [];
  const listCommand = new ListObjectsV2Command({
    Bucket: env.BACKUP_BUCKET_NAME,
  });

  const { Contents: blobs } = await client.send(listCommand);

  for await (const blob of blobs ?? []) {
    const name = blob.Key ?? "";
    const parts = name.split("-");

    parts.splice(0, 1);

    const amPm = parts.splice(parts.length - 1, 1)[0]?.replace(".sql", "") as "AM" | "PM";
    const date = new Date(parts.join("-"));
    const backup: Backup = {
      backupDate: date,
      backupName: name,
      backupWhen: amPm,
    };

    backups.push(backup);
  }

  return { count: backups.length, results: backups };
});
