import {
  Duration,
  aws_events as events,
  aws_lambda as lambda,
  aws_s3 as s3,
  Stack,
  aws_events_targets as targets,
  type StackProps,
} from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";
import { config } from "dotenv";

config();

export class CdkStackDev extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const environment: { [key: string]: string } = {
      API_HOST: process.env.API_HOST ?? "",
      API_NEWS_KEY: process.env.API_NEWS_KEY ?? "",
      AWS_AK_ID: process.env.AWS_AK_ID ?? "",
      AWS_R: process.env.AWS_R ?? "",
      AWS_SAK_ID: process.env.AWS_SAK_ID ?? "",
      BACKUP_BUCKET_NAME: "aswnn-mysql-backup.dev",
      BACKUP_KEEP_COUNT: process.env.BACKUP_KEEP_COUNT ?? "10",
      DATABASE_URL: process.env.DATABASE_URL_DEV ?? "",
      domain: process.env.DOMAIN_DEV ?? "",
      EMAIL_FROM: process.env.EMAIL_FROM_DEV ?? "",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? "",
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? "",
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ?? "",
      VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY ?? "",
    };

    const currentWeekUpdaterDev = new NodejsFunction(this, "CurrentWeekUpdaterDev", {
      bundling: {
        externalModules: [],
        nodeModules: [],
      },
      entry: "./functions/currentWeekUpdater.ts",
      environment,
      functionName: "CurrentWeekUpdaterDev",
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

    onceAnHourScheduleRule.addTarget(new targets.LambdaFunction(currentWeekUpdaterDev));

    const backupBucketDev = new s3.Bucket(this, "aswnn-mysql-backup.dev", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      bucketName: "aswnn-mysql-backup.dev",
    });

    const backupNflDatabaseDev = new NodejsFunction(this, "BackupNflDatabaseDev", {
      bundling: {
        externalModules: [],
        nodeModules: [],
      },
      entry: "./functions/backupNflDatabase.ts",
      environment,
      functionName: "BackupNflDatabaseDev",
      handler: "handler",
      retryAttempts: 0,
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(60),
    });

    backupBucketDev.grantReadWrite(backupNflDatabaseDev);
    backupBucketDev.grantDelete(backupNflDatabaseDev);

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

    twiceADayScheduleRule.addTarget(new targets.LambdaFunction(backupNflDatabaseDev));

    const futureGameUpdaterDev = new NodejsFunction(this, "FutureGameUpdaterDev", {
      bundling: {
        externalModules: [],
        nodeModules: [],
      },
      entry: "./functions/futureGameUpdater.ts",
      environment,
      functionName: "FutureGameUpdaterDev",
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

    twiceADayOnTheHalfHoursScheduleRule.addTarget(new targets.LambdaFunction(futureGameUpdaterDev));

    const liveGameUpdaterDev = new NodejsFunction(this, "LiveGameUpdaterDev", {
      bundling: {
        externalModules: [],
        nodeModules: [],
      },
      entry: "./functions/liveGameUpdater.ts",
      environment,
      functionName: "LiveGameUpdaterDev",
      handler: "handler",
      memorySize: 256,
      retryAttempts: 0,
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(300),
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

    every5MinutesScheduleRule.addTarget(new targets.LambdaFunction(liveGameUpdaterDev));

    new NodejsFunction(this, "ResetPoolDev", {
      bundling: {
        externalModules: [],
        nodeModules: [],
      },
      entry: "./functions/resetPool.ts",
      environment,
      functionName: "ResetPoolDev",
      handler: "handler",
      retryAttempts: 0,
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(120),
    });
  }
}
