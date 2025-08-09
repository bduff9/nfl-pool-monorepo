# @nfl-pool-monorepo/cron

This app is a CDK app that deploys AWS resources for the NFL Pool Monorepo.

## Usage

There are 3 environments: local, dev, and prod.  Local is only for testing locally and AWS SAM should be used to run the functions.  For example, to run the CurrentWeekUpdater lambda function:

```bash
cdk synth --no-staging
sam local invoke CurrentWeekUpdaterLocal --no-event -t ./cdk.out/CdkStackLocal.template.json
```

## Deploying

To deploy dev or prod, use the following commands:

```bash
cdk synth
cdk deploy CdkStackDev
cdk deploy CdkStackProd
```
