#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { HttpApiGatewayStack } from "../lib/http-api-gateway-stack";
import { SynchronousLambdaFunctionsStack } from "../lib/synchronous-lambda-functions-stack";
import { AsynchronousLambdaFunctionsStack } from "../lib/asynchronous-lambda-functions-stack";
import { CognitoStack } from "../lib/cognito-stack";
import { DevLambdaReplayStack } from "../lib/dev-lambda-replay-stack";
import { EcsServicesStack } from "../lib/ecs-services-stack";
import { RdsStack } from "../lib/rds-stack";
import { WebSocketApiStack } from "../lib/websocket-api-stack";
import { WebSocketLambdaFunctionsStack } from "../lib/websocket-lambda-functions-stack";

// Synth CDK app with:
// cdk synth --all -c useLocalImplementations=false -c enableRdsProxy=true -c skipEmailVerification=false -c useCustomAuthorizer=true -c enableWebSockets=true

// DEV deployment Command Example:
// cdk deploy --all -c useCustomWsAuthorizer=<boolean> -c enableWebSockets=false --require-approval never

// PROD deployment Command Example:                                    v false for quick testing, but should be true for true production
// cdk deploy --all -c useLocalImplementations=false -c enableEcsStack=false -c enableRdsProxy=false -c skipEmailVerification=false -c frontendUrl=<https://your-frontend-url.com> -c googleClientId=<your-google-client-id> -c googleClientSecret=<your-google-client-secret> -c useCustomWsAuthorizer=<boolean> -c enableWebSockets=true --require-approval never
//                                             ^ false for quick testing                       ^ false for quick testing, should be true for true production

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

// Optional Cognito flag. Defaults to false.
// - true: skip verification flow by attaching the pre-signup trigger.
// - false: use standard email verification behavior.
const skipEmailVerificationContext = app.node.tryGetContext(
  "skipEmailVerification",
);
const skipEmailVerification =
  typeof skipEmailVerificationContext === "string"
    ? skipEmailVerificationContext.toLowerCase() === "true"
    : (skipEmailVerificationContext ?? false);

// Optional stack toggles. Both default to false.
const enableEcsStackContext = app.node.tryGetContext("enableEcsStack");
const enableEcsStack =
  typeof enableEcsStackContext === "string"
    ? enableEcsStackContext.toLowerCase() === "true"
    : (enableEcsStackContext ?? false);

const enableWebSockets =
  app.node.tryGetContext("enableWebSockets") === "true" ? true : false;

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
    replayBucket: devLambdaReplayStack?.bucket,
    primaryDatabaseUrl: rdsStack?.primaryDatabaseUrl,
  },
);
if (devLambdaReplayStack) {
  asynchronousLambdaFunctionsStack.addDependency(devLambdaReplayStack);
}

// Create Cognito User Pool + Client + Identity Pool
const cognitoStack = new CognitoStack(app, "CognitoStack", {
  env: stackEnv,
  useLocalImplementations,
  skipEmailVerification,
  googleClientId: undefined,
  googleClientSecret: undefined,
  cognitoPreSignUpTriggerFn:
    asynchronousLambdaFunctionsStack.cognitoPreSignUpTriggerFn,
  cognitoCustomMessageFn:
    asynchronousLambdaFunctionsStack.cognitoCustomMessageFn,
  cognitoPostConfirmationTriggerFn:
    asynchronousLambdaFunctionsStack.cognitoPostConfirmationTriggerFn,
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
const ecsServicesStack =
  !useLocalImplementations && enableEcsStack
    ? new EcsServicesStack(app, "EcsServicesStack", {
        env: stackEnv,
      })
    : undefined;

// Create API stack ** API Gateway with Lambda and ECS integrations
// Created only in cloud mode (useLocalImplementations=false).
const httpApiGatewayStack = !useLocalImplementations
  ? new HttpApiGatewayStack(app, "HttpApiGatewayStack", {
      env: stackEnv,
      frontendUrl,
      useLocalImplementations,

      // Lambda integrations
      signInFn: synchronousLambdaFunctionsStack.signInFn,
      signOutFn: synchronousLambdaFunctionsStack.signOutFn,
      verifyUserFn: synchronousLambdaFunctionsStack.verifyUserFn,
      refreshFn: synchronousLambdaFunctionsStack.refreshFn,
      // <LambdaFunctionName>: synchronousLambdaFunctionsStack.<LambdaFunctionExport>,

      // ECS integrations
      langgraphServiceUrl: ecsServicesStack?.langgraphServiceUrl,
      // <ECSServiceURL>: ecsServicesStack?.<ecsServiceURL>,
    })
  : undefined;

// API Gateway dependencies (cloud mode only)
httpApiGatewayStack?.addDependency(synchronousLambdaFunctionsStack);
if (ecsServicesStack) {
  httpApiGatewayStack?.addDependency(ecsServicesStack);
}
if (rdsStack) {
  httpApiGatewayStack?.addDependency(rdsStack);
}

// Create handlers stack first (without API details)
const webSocketLambdaFunctionsStack = new WebSocketLambdaFunctionsStack(
  app,
  "WebSocketLambdaFunctionsStack",
  {},
);

// Use a custom Authorizer for WebSocket API if specified in context, otherwise allow all connections
const useCustomWsAuthorizer = app.node.tryGetContext("useCustomAuthorizer") // "true" or "false" (default to "false" if not set)
  ? "true"
  : "false";

// Create API stack with the handler functions
const webSocketApiStack = enableWebSockets
  ? new WebSocketApiStack(app, "WebSocketApiStack", {
      connectFn: webSocketLambdaFunctionsStack.connectFn,
      customActionFn: webSocketLambdaFunctionsStack.customActionFn,
      disconnectFn: webSocketLambdaFunctionsStack.disconnectFn,
      defaultFn: webSocketLambdaFunctionsStack.defaultFn,
      authorizerFn: webSocketLambdaFunctionsStack.authorizerFn,
      useCustomWsAuthorizer: useCustomWsAuthorizer,
    })
  : undefined;
