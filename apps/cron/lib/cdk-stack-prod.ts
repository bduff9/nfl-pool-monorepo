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

export class CdkStackProd extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const environment: { [key: string]: string } = {
      API_HOST: process.env.API_HOST ?? "",
      API_NEWS_KEY: process.env.API_NEWS_KEY ?? "",
      AWS_AK_ID: process.env.AWS_AK_ID ?? "",
      AWS_R: process.env.AWS_R ?? "",
      AWS_SAK_ID: process.env.AWS_SAK_ID ?? "",
      BACKUP_BUCKET_NAME: "aswnn-mysql-backup.prod",
      BACKUP_KEEP_COUNT: process.env.BACKUP_KEEP_COUNT ?? "10",
      DATABASE_URL: process.env.DATABASE_URL_PROD ?? "",
      domain: process.env.DOMAIN_PROD ?? "",
      EMAIL_FROM: process.env.EMAIL_FROM_PROD ?? "",
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? "",
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? "",
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ?? "",
      VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY ?? "",
      VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY ?? "",
    };

    const currentWeekUpdaterProd = new NodejsFunction(this, "CurrentWeekUpdaterProd", {
      bundling: {
        externalModules: [],
        nodeModules: [],
      },
      entry: "./functions/currentWeekUpdater.ts",
      environment,
      functionName: "CurrentWeekUpdaterProd",
      handler: "handler",
      retryAttempts: 0,
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.minutes(1),
    });

    const onceAnHourScheduleRule = new events.Rule(this, "onceAnHourScheduleRule", {
      schedule: events.Schedule.cron({
        day: "*",
        hour: "*",
        minute: "0",
        month: "1,9-12",
        year: "*",
      }),
    });

    onceAnHourScheduleRule.addTarget(new targets.LambdaFunction(currentWeekUpdaterProd));

    const backupBucketProd = new s3.Bucket(this, "aswnn-mysql-backup.prod", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      bucketName: "aswnn-mysql-backup.prod",
    });

    const backupNflDatabaseProd = new NodejsFunction(this, "BackupNflDatabaseProd", {
      bundling: {
        externalModules: [],
        nodeModules: [],
      },
      entry: "./functions/backupNflDatabase.ts",
      environment,
      functionName: "BackupNflDatabaseProd",
      handler: "handler",
      retryAttempts: 0,
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(60),
    });

    backupBucketProd.grantReadWrite(backupNflDatabaseProd);
    backupBucketProd.grantDelete(backupNflDatabaseProd);

    const twiceADayScheduleRule = new events.Rule(this, "twiceADayScheduleRule", {
      schedule: events.Schedule.cron({
        day: "*",
        hour: "4,16",
        minute: "55",
        month: "*",
        year: "*",
      }),
    });

    twiceADayScheduleRule.addTarget(new targets.LambdaFunction(backupNflDatabaseProd));

    const futureGameUpdaterProd = new NodejsFunction(this, "FutureGameUpdaterProd", {
      bundling: {
        externalModules: [],
        nodeModules: [],
      },
      entry: "./functions/futureGameUpdater.ts",
      environment,
      functionName: "FutureGameUpdaterProd",
      handler: "handler",
      retryAttempts: 0,
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(60),
    });

    const twiceADayOnTheHalfHoursScheduleRule = new events.Rule(this, "twiceADayOnTheHalfHoursScheduleRule", {
      schedule: events.Schedule.cron({
        day: "*",
        hour: "4,16",
        minute: "30",
        month: "1,9-12",
        year: "*",
      }),
    });

    twiceADayOnTheHalfHoursScheduleRule.addTarget(new targets.LambdaFunction(futureGameUpdaterProd));

    const liveGameUpdaterProd = new NodejsFunction(this, "LiveGameUpdaterProd", {
      bundling: {
        externalModules: [],
        nodeModules: [],
      },
      entry: "./functions/liveGameUpdater.ts",
      environment,
      functionName: "LiveGameUpdaterProd",
      handler: "handler",
      retryAttempts: 0,
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(60),
    });

    const every5MinutesScheduleRule = new events.Rule(this, "every5MinutesScheduleRule", {
      enabled: true,
      schedule: events.Schedule.cron({
        day: "*",
        hour: "*",
        minute: "*/5",
        month: "1,9-12",
        year: "*",
      }),
    });

    every5MinutesScheduleRule.addTarget(new targets.LambdaFunction(liveGameUpdaterProd));

    new NodejsFunction(this, "ResetPoolProd", {
      bundling: {
        externalModules: [],
        nodeModules: [],
      },
      entry: "./functions/resetPool.ts",
      environment,
      functionName: "ResetPoolProd",
      handler: "handler",
      retryAttempts: 0,
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(120),
    });
  }
}
