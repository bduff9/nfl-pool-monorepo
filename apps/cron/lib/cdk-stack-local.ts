import {
  Duration,
  aws_events as events,
  aws_lambda as lambda,
  Stack,
  type StackProps,
  aws_s3 as s3,
  aws_events_targets as targets,
} from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";
import { config } from "dotenv";

config();

export class CdkStackLocal extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const environment: { [key: string]: string } = {
      API_HOST: process.env.API_HOST ?? "",
      API_NEWS_KEY: process.env.API_NEWS_KEY ?? "",
      AWS_AK_ID: process.env.AWS_AK_ID ?? "",
      AWS_R: process.env.AWS_R ?? "",
      AWS_SAK_ID: process.env.AWS_SAK_ID ?? "",
      BACKUP_BUCKET_NAME: "aswnn-mysql-backup.local",
      BACKUP_KEEP_COUNT: process.env.BACKUP_KEEP_COUNT ?? "10",
      DATABASE_URL: process.env.DATABASE_URL_LOCAL ?? "",
      domain: process.env.DOMAIN_LOCAL ?? "",
      EMAIL_FROM: process.env.EMAIL_FROM_LOCAL ?? "",
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? "",
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? "",
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ?? "",
      VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY ?? "",
      VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY ?? "",
    };

    const currentWeekUpdaterLocal = new NodejsFunction(this, "CurrentWeekUpdaterLocal", {
      bundling: {
        externalModules: [],
        nodeModules: [],
      },
      entry: "./functions/currentWeekUpdater.ts",
      environment,
      functionName: "CurrentWeekUpdaterLocal",
      handler: "handler",
      retryAttempts: 0,
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
    });

    const onceAnHourScheduleRule = new events.Rule(this, "onceAnHourScheduleRule", {
      enabled: false,
      schedule: events.Schedule.cron({
        day: "*",
        hour: "*",
        minute: "0",
        month: "1,9-12",
        year: "*",
      }),
    });

    onceAnHourScheduleRule.addTarget(new targets.LambdaFunction(currentWeekUpdaterLocal));

    const backupBucketLocal = new s3.Bucket(this, "aswnn-mysql-backup.local", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      bucketName: "aswnn-mysql-backup.local",
    });

    const backupNflDatabaseLocal = new NodejsFunction(this, "BackupNflDatabaseLocal", {
      bundling: {
        externalModules: [],
        nodeModules: [],
      },
      entry: "./functions/backupNflDatabase.ts",
      environment,
      functionName: "BackupNflDatabaseLocal",
      handler: "handler",
      retryAttempts: 0,
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(60),
    });

    backupBucketLocal.grantReadWrite(backupNflDatabaseLocal);
    backupBucketLocal.grantDelete(backupNflDatabaseLocal);

    const twiceADayScheduleRule = new events.Rule(this, "twiceADayScheduleRule", {
      enabled: false,
      schedule: events.Schedule.cron({
        day: "*",
        hour: "4,16",
        minute: "55",
        month: "*",
        year: "*",
      }),
    });

    twiceADayScheduleRule.addTarget(new targets.LambdaFunction(backupNflDatabaseLocal));

    const futureGameUpdaterLocal = new NodejsFunction(this, "FutureGameUpdaterLocal", {
      bundling: {
        externalModules: [],
        nodeModules: [],
      },
      entry: "./functions/futureGameUpdater.ts",
      environment,
      functionName: "FutureGameUpdaterLocal",
      handler: "handler",
      retryAttempts: 0,
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(60),
    });

    const twiceADayOnTheHalfHoursScheduleRule = new events.Rule(this, "twiceADayOnTheHalfHoursScheduleRule", {
      enabled: false,
      schedule: events.Schedule.cron({
        day: "*",
        hour: "4,16",
        minute: "30",
        month: "1,9-12",
        year: "*",
      }),
    });

    twiceADayOnTheHalfHoursScheduleRule.addTarget(new targets.LambdaFunction(futureGameUpdaterLocal));

    const liveGameUpdaterLocal = new NodejsFunction(this, "LiveGameUpdaterLocal", {
      bundling: {
        externalModules: [],
        nodeModules: [],
      },
      entry: "./functions/liveGameUpdater.ts",
      environment,
      functionName: "LiveGameUpdaterLocal",
      handler: "handler",
      retryAttempts: 0,
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(60),
    });

    const every5MinutesScheduleRule = new events.Rule(this, "every5MinutesScheduleRule", {
      enabled: false,
      schedule: events.Schedule.cron({
        day: "*",
        hour: "*",
        minute: "*/5",
        month: "1,9-12",
        year: "*",
      }),
    });

    every5MinutesScheduleRule.addTarget(new targets.LambdaFunction(liveGameUpdaterLocal));

    new NodejsFunction(this, "ResetPoolLocal", {
      bundling: {
        externalModules: [],
        nodeModules: [],
      },
      entry: "./functions/resetPool.ts",
      environment,
      functionName: "ResetPoolLocal",
      handler: "handler",
      retryAttempts: 0,
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(120),
    });
  }
}
