#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';

import { CdkStackDev } from '../lib/cdk-stack-dev';
import { CdkStackLocal } from '../lib/cdk-stack-local';
import { CdkStackProd } from '../lib/cdk-stack-prod';

const app = new cdk.App();

try {
  new CdkStackLocal(app, 'CdkStackLocal', {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT ?? '',
      region: process.env.CDK_DEFAULT_REGION ?? '',
    },
  });
} catch (error) {
  console.error(error);
}

try {
  new CdkStackDev(app, 'CdkStackDev', {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT ?? '',
      region: process.env.CDK_DEFAULT_REGION ?? '',
    },
  });
} catch (error) {
  console.error(error);
}

try {
  new CdkStackProd(app, 'CdkStackProd', {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT ?? '',
      region: process.env.CDK_DEFAULT_REGION ?? '',
    },
  });
} catch (error) {
  console.error(error);
}

app.synth();
