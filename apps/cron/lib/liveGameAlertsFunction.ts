import { Duration, aws_events as events, aws_lambda as lambda } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";

/**
 * The live game alerts Lambda and its every-minute schedule, identical in every environment apart from its name
 * and whether the schedule is on. The caller attaches the function to the rule.
 */
export const createLiveGameAlerts = (
  scope: Construct,
  { enabled, environment, suffix }: { enabled: boolean; environment: { [key: string]: string }; suffix: string },
): { fn: NodejsFunction; rule: events.Rule } => {
  const fn = new NodejsFunction(scope, `LiveGameAlerts${suffix}`, {
    bundling: {
      externalModules: [],
      minify: true,
      nodeModules: [],
      sourceMap: true,
    },
    entry: "./functions/liveGameAlerts.ts",
    environment,
    functionName: `LiveGameAlerts${suffix}`,
    handler: "handler",
    memorySize: 256,
    retryAttempts: 0,
    runtime: lambda.Runtime.NODEJS_24_X,
    timeout: Duration.seconds(50),
  });

  const rule = new events.Rule(scope, "everyMinuteScheduleRule", {
    enabled,
    schedule: events.Schedule.cron({
      day: "*",
      hour: "*",
      minute: "*",
      month: "1,9-12",
      year: "*",
    }),
  });

  return { fn, rule };
};
