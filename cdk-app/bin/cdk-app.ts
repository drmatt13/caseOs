#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ApiGatewayStack } from "../lib/api-gateway-stack";
import { SynchronousLambdaFunctionsStack } from "../lib/synchronous-lambda-functions-stack";
import { AsynchronousLambdaFunctionsStack } from "../lib/asynchronous-lambda-functions-stack";
import { CognitoStack } from "../lib/cognito-stack";
import { DevLambdaReplayStack } from "../lib/dev-lambda-replay-stack";
import { EcsServicesStack } from "../lib/ecs-services-stack";
import { RdsStack } from "../lib/rds-stack";

// Synth CDK app with:
// cdk synth -c useLocalImplementations=false -c enableRdsProxy=false

// DEV deployment Command Example:
// cdk deploy --all --require-approval never

// PROD deployment Command Example:
// cdk deploy --all \
//   -c useLocalImplementations=false \
//   -c enableRdsProxy=false \
//   -c frontendUrl=<https://your-frontend-url.com> \
//   -c googleClientId=<your-google-client-id> \
//   -c googleClientSecret=<your-google-client-secret> \
//   --require-approval never

const app = new cdk.App();

// AWS CDK CLI sets the following context values automatically based on the command and environment:
// - cdk:account-context:accountId -> current AWS account ID
// - cdk:region-context:regionName -> current AWS region
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

// Single infrastructure mode flag.
// - true: use local-oriented implementations.
// - false: use cloud-oriented implementations.
const useLocalImplementationsContext = app.node.tryGetContext(
  "useLocalImplementations",
);
const useLocalImplementations =
  typeof useLocalImplementationsContext === "string"
    ? useLocalImplementationsContext.toLowerCase() === "true"
    : (useLocalImplementationsContext ?? true);

// Optional cloud-mode flag. Defaults to false and is force-disabled in local mode.
const enableRdsProxyContext = app.node.tryGetContext("enableRdsProxy");
// Enables creation of the RDS Proxy layer for cloud deployments.
const requestedEnableRdsProxy =
  typeof enableRdsProxyContext === "string"
    ? enableRdsProxyContext.toLowerCase() === "true"
    : (enableRdsProxyContext ?? false);
const enableRdsProxy = !useLocalImplementations && requestedEnableRdsProxy;

// Frontend URL for CORS configuration, can be set via context or environment variable. Defaults to localhost for development.
const frontendUrl =
  app.node.tryGetContext("frontendUrl") ?? "http://localhost:3000";

// Created only in local mode (useLocalImplementations=true).
const devLambdaReplayStack = useLocalImplementations
  ? new DevLambdaReplayStack(app, "DevLambdaReplayStack", {
      env: stackEnv,
    })
  : undefined;

// Created only in cloud mode (useLocalImplementations=false).
const rdsStack = !useLocalImplementations
  ? new RdsStack(app, "RdsStack", {
      env: stackEnv,
      enableRdsProxy,
    })
  : undefined;

// Create Asynchronous Lambda Functions Stack
const asynchronousLambdaFunctionsStack = new AsynchronousLambdaFunctionsStack(
  app,
  "AsynchronousLambdaFunctionsStack",
  {
    env: stackEnv,
    frontendUrl,
    useLocalImplementations,
    replayBucketName: devLambdaReplayStack?.bucket.bucketName,
    replayQueueUrl: devLambdaReplayStack?.queue.queueUrl,
  },
);

// Create Cognito User Pool + Client + Identity Pool
const cognitoStack = new CognitoStack(app, "CognitoStack", {
  env: stackEnv,
  useLocalImplementations,
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

// Created only in cloud mode (useLocalImplementations=false).
const ecsServicesStack = !useLocalImplementations
  ? new EcsServicesStack(app, "EcsServicesStack", {
      env: stackEnv,
    })
  : undefined;

// Create API stack ** API Gateway with Lambda and ECS integrations
// Created only in cloud mode (useLocalImplementations=false).
const apiGatewayStack = !useLocalImplementations
  ? new ApiGatewayStack(app, "ApiGatewayStack", {
      env: stackEnv,
      frontendUrl,
      useLocalImplementations,
      // Lambda integrations
      signIn: synchronousLambdaFunctionsStack.signIn,
      signOut: synchronousLambdaFunctionsStack.signOut,
      verifyUser: synchronousLambdaFunctionsStack.verifyUser,
      refresh: synchronousLambdaFunctionsStack.refresh,
      // <LambdaFunctionName>: synchronousLambdaFunctionsStack.<LambdaFunctionExport>,
      // ECS integrations
      langgraphServiceUrl: ecsServicesStack?.langgraphServiceUrl,
      // <ECSServiceURL>: ecsServicesStack?.<ecsServiceURL>,
    })
  : undefined;

// API Gateway dependencies (cloud mode only)
apiGatewayStack?.addDependency(synchronousLambdaFunctionsStack);
if (ecsServicesStack) {
  apiGatewayStack?.addDependency(ecsServicesStack);
}
if (rdsStack) {
  apiGatewayStack?.addDependency(rdsStack);
}
