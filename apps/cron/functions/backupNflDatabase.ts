import { createReadStream, promises as fs } from "node:fs";

import { DeleteObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getBackupName, parseDbUrl } from "@nfl-pool-monorepo/utils/database";
import type { Handler } from "aws-lambda";
import mysqldump from "mysqldump";

export const handler: Handler<never, void> = async (_event, _context) => {
  const timeStamp = new Date().toISOString();

  console.log(`Executing mysqldump at ${timeStamp}...`);

  const connection = parseDbUrl(process.env.DATABASE_URL ?? "");
  const blobName = getBackupName();
  const dumpFile = `/tmp/${blobName}`;

  await mysqldump({
    connection,
    dump: {
      data: {
        format: false,
        lockTables: true,
        maxRowsPerInsertStatement: 9999,
        verbose: true,
      },
      schema: {
        format: false,
        table: {
          dropIfExist: true,
        },
      },
      trigger: {
        dropIfExist: true,
      },
    },
    dumpToFile: dumpFile,
  });

  console.log(`Dump finished at ${new Date().toISOString()}!`);

  console.log("Uploading to AWS S3 as blob:", blobName);

  const client = new S3Client({
    region: process.env.AWS_R ?? "",
  });

  // Stream the dump straight to S3 in parts - loading the whole file into memory would
  // OOM the Lambda as the database grows over the season.
  const upload = new Upload({
    client,
    params: {
      Body: createReadStream(dumpFile),
      Bucket: process.env.BACKUP_BUCKET_NAME,
      Key: blobName,
    },
  });

  await upload.done();

  console.log("Blob was uploaded successfully.");

  console.log("Deleting temp file...", dumpFile);

  await fs.unlink(dumpFile);

  console.log("Temp file deleted!");

  console.log("Listing blobs...");

  const backups: string[] = [];
  let continuationToken: string | undefined;

  do {
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.BACKUP_BUCKET_NAME,
      ContinuationToken: continuationToken,
    });

    const { Contents: blobs, NextContinuationToken } = await client.send(listCommand);

    for (const blob of blobs ?? []) {
      if (blob.Key) {
        console.log(blob.Key);
        backups.push(blob.Key);
      }
    }

    continuationToken = NextContinuationToken;
  } while (continuationToken);

  backups.sort();
  console.log(`Found ${backups.length} backups`);

  // Number(...) of an unset env is NaN, which would silently disable retention.
  const keepCount = Number(process.env.BACKUP_KEEP_COUNT ?? 10) || 10;

  while (backups.length > keepCount) {
    const backupToDelete = backups.shift();

    if (backupToDelete) {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.BACKUP_BUCKET_NAME,
        Key: backupToDelete,
      });
      await client.send(deleteCommand);
    }
  }

  console.log("Backup NFL database function ran!", new Date().toISOString());
};
