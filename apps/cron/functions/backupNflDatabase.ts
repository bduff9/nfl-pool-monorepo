import { promises as fs } from "fs";

import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
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
    credentials: { accessKeyId: process.env.AWS_AK_ID ?? "", secretAccessKey: process.env.AWS_SAK_ID ?? "" },
    region: process.env.AWS_R ?? "",
  });

  const fileContent = await fs.readFile(dumpFile);

  const putCommand = new PutObjectCommand({
    Body: fileContent,
    Bucket: process.env.BACKUP_BUCKET_NAME,
    Key: blobName,
  });

  await client.send(putCommand);

  console.log("Blob was uploaded successfully.");

  console.log("Deleting temp file...", dumpFile);

  await fs.unlink(dumpFile);

  console.log("Temp file deleted!");

  console.log("Listing blobs...");

  const listCommand = new ListObjectsV2Command({
    Bucket: process.env.BACKUP_BUCKET_NAME,
  });

  const { Contents: blobs } = await client.send(listCommand);
  const backups: Array<string> = [];

  for (const blob of blobs ?? []) {
    if (blob.Key) {
      console.log(blob.Key);
      backups.push(blob.Key);
    }
  }

  backups.sort();
  console.log(`Found ${backups.length} backups`);

  while (backups.length > +(process.env.BACKUP_KEEP_COUNT ?? 10)) {
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
