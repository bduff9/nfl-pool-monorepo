"use server";

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { executeSqlFile } from "@nfl-pool-monorepo/utils/database";

import { restoreBackupSchema, serverActionResultSchema } from "@/lib/zod";
import { adminProcedure } from "@/lib/zsa.server";
import "server-only";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ZSAError } from "zsa";

import { env } from "@/lib/env";

export const restoreBackup = adminProcedure
  .input(restoreBackupSchema)
  .output(serverActionResultSchema)
  .handler(async ({ ctx, input }) => {
    const { backupName } = input;

    try {
      const s3Client = new S3Client({
        credentials: { accessKeyId: env.AWS_AK_ID, secretAccessKey: env.AWS_SAK_ID },
        region: env.AWS_R,
      });
      const getObjectCommand = new GetObjectCommand({
        Bucket: process.env.BACKUP_BUCKET_NAME,
        Key: backupName,
      });

      const { Body } = await s3Client.send(getObjectCommand);

      if (!Body) {
        throw new ZSAError("ERROR", "Failed to get S3 object body as a readable stream.");
      }

      const sqlFile = await Body.transformToString("utf-8");

      await executeSqlFile(sqlFile);
      await db
        .insertInto("Logs")
        .values({
          LogAction: "BACKUP_RESTORE",
          LogAddedBy: ctx.user.email,
          LogMessage: `${ctx.user.name} has restored backup ${backupName}`,
          LogUpdatedBy: ctx.user.email,
          UserID: ctx.user.id,
        })
        .executeTakeFirstOrThrow();
    } catch (error) {
      console.error(`Failed to restore backup ${backupName}`, error);

      if (error instanceof ZSAError) {
        throw error;
      }

      throw new ZSAError("INTERNAL_SERVER_ERROR", `Failed to restore backup ${backupName}`);
    }

    return {
      metadata: {},
      status: "Success",
    };
  });
