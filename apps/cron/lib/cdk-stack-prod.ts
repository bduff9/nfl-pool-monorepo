import {
  aws_cloudwatch as cloudwatch,
  aws_cloudwatch_actions as cloudwatchActions,
  Duration,
  aws_events as events,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_logs as logs,
  Size,
  Stack,
  type StackProps,
  aws_s3 as s3,
  aws_sns as sns,
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
      EMAIL_LINK_SECRET: process.env.EMAIL_LINK_SECRET ?? "",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? "",
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? "",
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ?? "",
      VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY ?? "",
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
      memorySize: 512,
      retryAttempts: 0,
      runtime: lambda.Runtime.NODEJS_24_X,
      timeout: Duration.minutes(5),
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
      ephemeralStorageSize: Size.mebibytes(1024),
      functionName: "BackupNflDatabaseProd",
      handler: "handler",
      memorySize: 2048,
      retryAttempts: 0,
      runtime: lambda.Runtime.NODEJS_24_X,
      timeout: Duration.seconds(300),
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
      memorySize: 256,
      retryAttempts: 0,
      runtime: lambda.Runtime.NODEJS_24_X,
      timeout: Duration.minutes(5),
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
      memorySize: 512,
      retryAttempts: 0,
      runtime: lambda.Runtime.NODEJS_24_X,
      timeout: Duration.minutes(5),
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

    const resetPoolProd = new NodejsFunction(this, "ResetPoolProd", {
      bundling: {
        externalModules: [],
        nodeModules: [],
      },
      entry: "./functions/resetPool.ts",
      environment,
      functionName: "ResetPoolProd",
      handler: "handler",
      memorySize: 256,
      retryAttempts: 0,
      runtime: lambda.Runtime.NODEJS_24_X,
      timeout: Duration.seconds(300),
    });

    const alertsTopic = new sns.Topic(this, "ProdAlertsTopic", {
      displayName: "NFL Pool Prod Alerts",
      topicName: "nfl-pool-prod-alerts",
    });

    alertsTopic.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["sns:Publish"],
        conditions: { StringEquals: { "aws:SourceAccount": Stack.of(this).account } },
        principals: [new iam.ServicePrincipal("cloudwatch.amazonaws.com")],
        resources: [alertsTopic.topicArn],
        sid: "AllowCloudWatchAlarmsToPublish",
      }),
    );

    const prodFunctions: Array<{ fn: NodejsFunction; memorySize: number }> = [
      { fn: backupNflDatabaseProd, memorySize: 2048 },
      { fn: currentWeekUpdaterProd, memorySize: 512 },
      { fn: futureGameUpdaterProd, memorySize: 256 },
      { fn: liveGameUpdaterProd, memorySize: 512 },
      { fn: resetPoolProd, memorySize: 256 },
    ];

    for (const { fn, memorySize } of prodFunctions) {
      const functionName = fn.node.id;
      const memoryAlarmThreshold = Math.round(memorySize * 0.9);

      const errorsAlarm = new cloudwatch.Alarm(this, `${functionName}ErrorsAlarm`, {
        alarmDescription: `${functionName} reported at least one invocation error (includes timeouts and out-of-memory kills). Check logs at /aws/lambda/${functionName}.`,
        alarmName: `nfl-pool-prod-${functionName}-errors`,
        evaluationPeriods: 1,
        metric: fn.metricErrors({ period: Duration.minutes(5) }),
        threshold: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      errorsAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertsTopic));

      // MemoryUtilization is not emitted in this account, so track the "Max Memory Used" value
      // from each invocation's REPORT line via a log metric filter instead. Metric filter
      // patterns must consume the entire log line and allow only one ellipsis and two regex
      // terms, so this matches warm successes (which end at "MB"); OOM/timeout invocations
      // are covered by the errors alarm above.
      const memoryMetricFilter = new logs.MetricFilter(this, `${functionName}MemoryMetricFilter`, {
        filterPattern: logs.FilterPattern.literal("[REPORT, ..., Max, Memory, usedLbl=%Used:%, memUsed, MB]"),
        logGroup: logs.LogGroup.fromLogGroupName(this, `${functionName}LogGroup`, `/aws/lambda/${functionName}`),
        metricName: `${functionName}MaxMemoryMB`,
        metricNamespace: "NFLPool/Lambda",
        metricValue: "$memUsed",
      });

      const memoryAlarm = new cloudwatch.Alarm(this, `${functionName}MemoryAlarm`, {
        alarmDescription: `${functionName} used ${memoryAlarmThreshold}+ MB of its ${memorySize} MB in a single invocation. Consider raising memorySize in cdk-stack-prod.ts.`,
        alarmName: `nfl-pool-prod-${functionName}-memory`,
        evaluationPeriods: 1,
        metric: memoryMetricFilter.metric({ period: Duration.minutes(5), statistic: cloudwatch.Stats.MAXIMUM }),
        threshold: memoryAlarmThreshold,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      memoryAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertsTopic));
    }
  }
}
