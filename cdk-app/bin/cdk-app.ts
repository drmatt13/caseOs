#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
// import { LambdaHandlersStack } from "../lib/lambda-handlers-stack";
// import { EcsStack } from "../lib/ecs-stack";
// import { ApiStack } from "../lib/api-stack";

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;

if (!account || !region) {
  throw new Error(
    "CDK_DEFAULT_ACCOUNT and CDK_DEFAULT_REGION must be set for VPC lookup.",
  );
}

const stackEnv: cdk.Environment = {
  account,
  region,
};

// Create handlers stack first (without API details)
// const handlersStack = new LambdaHandlersStack(app, "LambdaHandlersStack", {
//   env: stackEnv,
// });

// const ecsStack = new EcsStack(app, "EcsStack", {
//   env: stackEnv,
// });

// Create API stack with the handler functions
// const apiStack = new ApiStack(app, "ApiStack", {
// env: stackEnv,
// testFunction1: handlersStack.testFunction1,
// testFunction2: handlersStack.testFunction2,
// testContainer1Url: ecsStack.testContainer1Url,
// testContainer2Url: ecsStack.testContainer2Url,
// });

// apiStack.addDependency(handlersStack);
// apiStack.addDependency(ecsStack);
