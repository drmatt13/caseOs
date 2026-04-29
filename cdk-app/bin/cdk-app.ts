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

// Context Flags (with defaults)
//
// -c useLocalImplementations       (default: true)
// -c enableRdsProxy                (default: false, also disabled when useLocalImplementations=true)
// -c skipEmailVerification         (default: false)
// -c enableEcsStack                (default: false)
// -c enableWebSockets              (default: false)
// -c useCustomWsAuthorizer         (default: false)
// -c retainStatefulResources       (default: false) - Cognito, RDS, Secrets
//
// -c frontendUrl                   (default: "http://localhost:3000")
//
// -c googleClientId                (default: undefined)
// -c googleClientSecret            (default: undefined)

// Complete Synth:
// cdk synth --all -c useLocalImplementations=false -c enableRdsProxy=true -c skipEmailVerification=false -c useCustomWsAuthorizer=true -c enableWebSockets=true

// Current DEV deployment:
// cdk deploy --all -c useCustomWsAuthorizer=true -c enableWebSockets=true -c skipEmailVerification=true --require-approval never

// Current PROD deployment:
// cdk deploy --all -c useLocalImplementations=false -c useCustomWsAuthorizer=true -c enableWebSockets=true -c enableEcsStack=false  -c skipEmailVerification=true -c frontendUrl=http://localhost:3000 --require-approval never

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

// For Production RDS, local postgres is defined in docker-compose.yml
const primaryDatabaseName = "app_db";
const primaryDatabaseUsername = "app_user";

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

const retainStatefulResoucesContext = app.node.tryGetContext(
  "retainStatefulResouces",
);
const retainStatefulResouces =
  typeof retainStatefulResoucesContext === "string"
    ? retainStatefulResoucesContext.toLowerCase() === "true"
    : (retainStatefulResoucesContext ?? false);

const enableWebSockets =
  app.node.tryGetContext("enableWebSockets") === "true" ? true : false;

// Frontend URL for CORS configuration, can be set via context or environment variable. Defaults to localhost for development.
const frontendUrl =
  app.node.tryGetContext("frontendUrl") ?? "http://localhost:3000";
const normalizedFrontendUrl = String(frontendUrl).replace(/\/+$/, "");
const authCallbackUrl = `${normalizedFrontendUrl}/auth/callback`;

const googleClientIdContext = app.node.tryGetContext("googleClientId");
const googleClientSecretContext = app.node.tryGetContext("googleClientSecret");
const googleClientId = googleClientIdContext
  ? String(googleClientIdContext)
  : undefined;
const googleClientSecret = googleClientSecretContext
  ? cdk.SecretValue.unsafePlainText(String(googleClientSecretContext))
  : undefined;

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
      primaryDatabaseName,
      primaryDatabaseUsername,
      retainStatefulResouces,
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
    // If RDS is not created, the function falls back to its local/runtime env flow.
    primaryDatabaseSecretArn: rdsStack?.credentialsSecretArn,
  },
);
if (devLambdaReplayStack) {
  asynchronousLambdaFunctionsStack.addDependency(devLambdaReplayStack);
}

// Create Cognito User Pool + Client + Identity Pool
const cognitoStack = new CognitoStack(app, "CognitoStack", {
  env: stackEnv,
  useLocalImplementations,
  retainStatefulResouces,
  skipEmailVerification,
  googleClientId,
  googleClientSecret,
  callbackUrls: [authCallbackUrl],
  logoutUrls: [normalizedFrontendUrl],
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
    userPoolDomainUrl: cognitoStack.userPoolDomainUrl,
    primaryDatabaseSecretArn: rdsStack?.credentialsSecretArn,
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

      // User Pool Authorizer
      httpUserPoolAuthorizerConfig:
        synchronousLambdaFunctionsStack.httpUserPoolAuthorizerConfig,

      // Lambda integrations
      signInFn: synchronousLambdaFunctionsStack.signInFn,
      signOutFn: synchronousLambdaFunctionsStack.signOutFn,
      oauthCallbackFn: synchronousLambdaFunctionsStack.oauthCallbackFn,
      verifyUserFn: synchronousLambdaFunctionsStack.verifyUserFn,
      refreshFn: synchronousLambdaFunctionsStack.refreshFn,
      getUserFn: synchronousLambdaFunctionsStack.getUserFn,
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
  {
    env: stackEnv,
    userPoolId: cognitoStack.userPoolId,
    userPoolClientId: cognitoStack.userPoolClientId,
  },
);
webSocketLambdaFunctionsStack.addDependency(cognitoStack);

// Use a custom authorizer for WebSocket API when explicitly enabled via context.
const useCustomWsAuthorizerContext = app.node.tryGetContext(
  "useCustomWsAuthorizer",
);
const useCustomWsAuthorizer =
  typeof useCustomWsAuthorizerContext === "string"
    ? useCustomWsAuthorizerContext.toLowerCase() === "true"
      ? "true"
      : "false"
    : (useCustomWsAuthorizerContext ?? false)
      ? "true"
      : "false";

// Create API stack with the handler functions
const webSocketApiStack = enableWebSockets
  ? new WebSocketApiStack(app, "WebSocketApiStack", {
      env: stackEnv,
      connectFn: webSocketLambdaFunctionsStack.connectFn,
      customActionFn: webSocketLambdaFunctionsStack.customActionFn,
      disconnectFn: webSocketLambdaFunctionsStack.disconnectFn,
      defaultFn: webSocketLambdaFunctionsStack.defaultFn,
      authorizerFn: webSocketLambdaFunctionsStack.authorizerFn,
      useCustomWsAuthorizer: useCustomWsAuthorizer,
    })
  : undefined;
