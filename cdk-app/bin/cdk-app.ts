#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ApiGatewayStack } from "../lib/api-gateway-stack";
import { SynchronousLambdaFunctionsStack } from "../lib/synchronous-lambda-functions-stack";
import { AsynchronousLambdaFunctionsStack } from "../lib/asynchronous-lambda-functions-stack";
import { CognitoStack } from "../lib/cognito-stack";
import { DevLambdaReplayStack } from "../lib/dev-lambda-replay-stack";
import { EcsServicesStack } from "../lib/ecs-services-stack";

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

const captureEventDrivenFunctions =
  app.node.tryGetContext("captureEventDrivenFunctions") ?? "true"; // "true" or "false"

const stage = app.node.tryGetContext("stage") ?? "dev";
const isProduction = stage === "prod";
const frontendUrl =
  app.node.tryGetContext("frontendUrl") ??
  process.env.FRONTEND_URL ??
  "http://localhost:3000";

// Create Dev Lambda Replay Stack
const devLambdaReplayStack = new DevLambdaReplayStack(
  app,
  "DevLambdaReplayStack",
  {
    env: stackEnv,
  },
);

// Create Asynchronous Lambda Functions Stack
const asynchronousLambdaFunctionsStack = new AsynchronousLambdaFunctionsStack(
  app,
  "AsynchronousLambdaFunctionsStack",
  {
    env: stackEnv,
    frontendUrl,
    captureEventDrivenFunctions,
    replayBucketName: devLambdaReplayStack.bucket.bucketName,
    replayQueueUrl: devLambdaReplayStack.queue.queueUrl,
  },
);

// Create Cognito User Pool + Client + Identity Pool
const cognitoStack = new CognitoStack(app, "CognitoStack", {
  env: stackEnv,
  isProduction,
  googleClientId: undefined,
  googleClientSecret: undefined,
  asynchronousLambdaFunctionsStack,
});
cognitoStack.addDependency(asynchronousLambdaFunctionsStack);

// Create Synchronous Lambda Functions Stack
const synchronousLambdaFunctionsStack = new SynchronousLambdaFunctionsStack(
  app,
  "SynchronousLambdaFunctionsStack",
  {
    env: stackEnv,
    userPoolId: cognitoStack.userPoolId,
    userPoolClientId: cognitoStack.userPoolClientId,
  },
);
synchronousLambdaFunctionsStack.addDependency(cognitoStack);

// Create ECS stack next (without API details) ** ECS Containers
const ecsServicesStack = new EcsServicesStack(app, "EcsServicesStack", {
  env: stackEnv,
});

// Create API stack ** API Gateway with Lambda and ECS integrations
const apiGatewayStack = new ApiGatewayStack(app, "ApiGatewayStack", {
  env: stackEnv,
  signIn: synchronousLambdaFunctionsStack.signIn,
  signOut: synchronousLambdaFunctionsStack.signOut,
  verifyUser: synchronousLambdaFunctionsStack.verifyUser,
  refresh: synchronousLambdaFunctionsStack.refresh,
  frontendUrl,
  // testContainer1Url: ecsServicesStack.testContainer1Url,
  // testContainer2Url: ecsServicesStack.testContainer2Url,
});

apiGatewayStack.addDependency(synchronousLambdaFunctionsStack);
// apiGatewayStack.addDependency(ecsServicesStack);
