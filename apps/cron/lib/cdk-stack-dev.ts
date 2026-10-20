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

import { fromEnv } from "./fromEnv";
import { createLiveGameAlerts } from "./liveGameAlertsFunction";

config();

const getEnvironment = (): { [key: string]: string } => ({
  API_HOST: fromEnv("API_HOST"),
  AWS_AK_ID: fromEnv("AWS_AK_ID"),
  AWS_R: fromEnv("AWS_R"),
  AWS_SAK_ID: fromEnv("AWS_SAK_ID"),
  BACKUP_BUCKET_NAME: "aswnn-mysql-backup.dev",
  BACKUP_KEEP_COUNT: fromEnv("BACKUP_KEEP_COUNT", "10"),
  DATABASE_URL: fromEnv("DATABASE_URL_DEV"),
  domain: fromEnv("DOMAIN_DEV"),
  EMAIL_FROM: fromEnv("EMAIL_FROM_DEV"),
  EMAIL_LINK_SECRET: fromEnv("EMAIL_LINK_SECRET"),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: fromEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY"),
  NODE_OPTIONS: "--enable-source-maps",
  TWILIO_ACCOUNT_SID: fromEnv("TWILIO_ACCOUNT_SID"),
  TWILIO_AUTH_TOKEN: fromEnv("TWILIO_AUTH_TOKEN"),
  TWILIO_PHONE_NUMBER: fromEnv("TWILIO_PHONE_NUMBER"),
  TYPESAFE_API_KEY: fromEnv("TYPESAFE_API_KEY"),
  VAPID_PRIVATE_KEY: fromEnv("VAPID_PRIVATE_KEY"),
});

export class CdkStackDev extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const environment = getEnvironment();

    // Minified bundles: smaller upload, faster cold start. Source maps keep stack traces readable.
    const currentWeekUpdaterDev = new NodejsFunction(this, "CurrentWeekUpdaterDev", {
      bundling: {
        externalModules: [],
        minify: true,
        nodeModules: [],
        sourceMap: true,
      },
      entry: "./functions/currentWeekUpdater.ts",
      environment,
      functionName: "CurrentWeekUpdaterDev",
      handler: "handler",
      memorySize: 256,
      retryAttempts: 0,
      runtime: lambda.Runtime.NODEJS_24_X,
      timeout: Duration.minutes(5),
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
        minify: true,
        nodeModules: [],
        sourceMap: true,
      },
      entry: "./functions/backupNflDatabase.ts",
      environment,
      functionName: "BackupNflDatabaseDev",
      handler: "handler",
      memorySize: 256,
      retryAttempts: 0,
      runtime: lambda.Runtime.NODEJS_24_X,
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
        minify: true,
        nodeModules: [],
        sourceMap: true,
      },
      entry: "./functions/futureGameUpdater.ts",
      environment,
      functionName: "FutureGameUpdaterDev",
      handler: "handler",
      memorySize: 256,
      retryAttempts: 0,
      runtime: lambda.Runtime.NODEJS_24_X,
      timeout: Duration.minutes(5),
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
        minify: true,
        nodeModules: [],
        sourceMap: true,
      },
      entry: "./functions/liveGameUpdater.ts",
      environment,
      functionName: "LiveGameUpdaterDev",
      handler: "handler",
      memorySize: 256,
      retryAttempts: 0,
      runtime: lambda.Runtime.NODEJS_24_X,
      timeout: Duration.minutes(5),
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

    const liveGameAlertsDev = createLiveGameAlerts(this, { enabled: false, environment, suffix: "Dev" });

    liveGameAlertsDev.rule.addTarget(new targets.LambdaFunction(liveGameAlertsDev.fn));

    new NodejsFunction(this, "ResetPoolDev", {
      bundling: {
        externalModules: [],
        minify: true,
        nodeModules: [],
        sourceMap: true,
      },
      entry: "./functions/resetPool.ts",
      environment,
      functionName: "ResetPoolDev",
      handler: "handler",
      retryAttempts: 0,
      runtime: lambda.Runtime.NODEJS_24_X,
      timeout: Duration.seconds(120),
    });
  }
}
