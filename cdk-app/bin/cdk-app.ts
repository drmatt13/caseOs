#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CognitoStack } from "../lib/cognito-stack";
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

const stage = app.node.tryGetContext("stage") ?? "dev";
const isProduction = stage === "prod";

// Create Cognito User Pool + Client + Identity Pool
const cognitoStack = new CognitoStack(app, "CognitoStack", {
  env: stackEnv,
  isProduction,
  googleClientId: undefined,
  googleClientSecret: undefined,
});

// Create handlers stack first (without API details) ** Lambda Functions
// const handlersStack = new LambdaHandlersStack(app, "LambdaHandlersStack", {
//   env: stackEnv,
// });

// Create ECS stack next (without API details) ** ECS Containers
// const ecsStack = new EcsStack(app, "EcsStack", {
//   env: stackEnv,
// });

// Create API stack ** API Gateway with Lambda and ECS integrations
// const apiStack = new ApiStack(app, "ApiStack", {
// env: stackEnv,
// testFunction1: handlersStack.testFunction1,
// testFunction2: handlersStack.testFunction2,
// testContainer1Url: ecsStack.testContainer1Url,
// testContainer2Url: ecsStack.testContainer2Url,
// });

// apiStack.addDependency(handlersStack);
// apiStack.addDependency(ecsStack);
