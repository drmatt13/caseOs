#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import * as fs from "fs";
import * as path from "path";
import { HttpApiGatewayStack } from "../lib/http-api-gateway-stack";
import { SynchronousLambdaFunctionsStack } from "../lib/synchronous-lambda-functions-stack";
import { AsynchronousLambdaFunctionsStack } from "../lib/asynchronous-lambda-functions-stack";
import { CognitoStack } from "../lib/cognito-stack";
import { DevLambdaReplayStack } from "../lib/dev-lambda-replay-stack";
import { EcsServicesStack } from "../lib/ecs-services-stack";
import { RdsStack } from "../lib/rds-stack";
import { WebSocketApiStack } from "../lib/websocket-api-stack";
import { WebSocketLambdaFunctionsStack } from "../lib/websocket-lambda-functions-stack";
import { ApplicationS3Stack } from "../lib/application-s3-stack";
import { FrontendWebsiteS3Stack } from "../lib/frontend-website-s3-stack";
import { CloudFrontStack } from "../lib/cloudfront-stack";

const loadDotEnv = (envPath: string) => {
  if (!fs.existsSync(envPath)) {
    return;
  }

  const envFile = fs.readFileSync(envPath, "utf8");

  for (const line of envFile.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    let value = trimmedLine.slice(separatorIndex + 1).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
};

loadDotEnv(path.join(__dirname, "..", ".env"));

// Context Flags (with defaults)
//
// -c useLocalDevStack              (default: true)
// -c enableRdsProxy                (default: false, also disabled when useLocalDevStack=true)
// -c skipEmailVerification         (default: false)
// -c enableEcsStack                (default: false)
// -c enableWebSockets              (default: false)
// -c useCustomWsAuthorizer         (default: false)
// -c retainStatefulResources       (default: false) - Cognito, RDS, Secrets
//
// -c frontendUrl                   (optional prod extra Cognito callback/logout URL)
//
// -c googleClientId                (default: GOOGLE_CLIENT_ID from .env)
// -c googleClientSecret            (default: GOOGLE_CLIENT_SECRET from .env)

// Complete Synth:
// cdk synth --all -c useLocalDevStack=false -c enableRdsProxy=true -c skipEmailVerification=false -c useCustomWsAuthorizer=true -c enableWebSockets=true

// Current DEV deployment:
// cdk deploy --all -c useCustomWsAuthorizer=true -c enableWebSockets=true -c skipEmailVerification=true --require-approval never

// Current PROD deployment:
// cdk deploy --all -c useLocalDevStack=false -c useCustomWsAuthorizer=true -c enableWebSockets=true -c enableEcsStack=false -c skipEmailVerification=true --require-approval never

// If migrate from DEV to PROD
// cdk destroy DevLambdaReplayStack --exclusively -c enableWebSockets=true -c skipEmailVerification=true --force --profile=dev

// If migrate from PROD to DEV
// cdk destroy CloudFrontStack HttpApiGatewayStack EcsServicesStack RdsStack -c useLocalDevStack=false -c useCustomWsAuthorizer=true -c enableWebSockets=true -c enableEcsStack=false -c skipEmailVerification=true --require-approval never

// Frontend website bucket deployment:
// <build frontend assets in ../client-app/dist>
// aws s3 cp ../client-app/dist s3://<frontend-website-s3-bucket-name> --recursive

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
// - true: use the local dev stack.
// - false: use the production cloud stack.
const useLocalDevStackContext = app.node.tryGetContext("useLocalDevStack");
const useLocalDevStack =
  typeof useLocalDevStackContext === "string"
    ? useLocalDevStackContext.toLowerCase() === "true"
    : (useLocalDevStackContext ?? true);

// Optional cloud-mode flag. Defaults to false and is force-disabled in local mode.
const enableRdsProxyContext = app.node.tryGetContext("enableRdsProxy");
// Enables creation of the RDS Proxy layer for cloud deployments.
const requestedEnableRdsProxy =
  typeof enableRdsProxyContext === "string"
    ? enableRdsProxyContext.toLowerCase() === "true"
    : (enableRdsProxyContext ?? false);
const enableRdsProxy = !useLocalDevStack && requestedEnableRdsProxy;

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

const frontendWebsiteS3Stack = new FrontendWebsiteS3Stack(
  app,
  "FrontendWebsiteS3Stack",
  {
    env: stackEnv,
  },
);

// Created only in production cloud stack mode (useLocalDevStack=false).
const cloudFrontStack = !useLocalDevStack
  ? new CloudFrontStack(app, "CloudFrontStack", {
      env: stackEnv,
      frontendWebsiteBucketArn:
        frontendWebsiteS3Stack.frontendWebsiteBucket.bucketArn,
      frontendWebsiteBucketName:
        frontendWebsiteS3Stack.frontendWebsiteBucket.bucketName,
      frontendWebsiteBucketRegionalDomainName:
        frontendWebsiteS3Stack.frontendWebsiteBucket.bucketRegionalDomainName,
    })
  : undefined;

const normalizeFrontendUrl = (url: string) =>
  cdk.Token.isUnresolved(url) ? url : url.replace(/\/+$/, "");

// The primary frontend URL is used by non-Cognito consumers. In prod, Cognito
// always includes the CloudFront URL and treats frontendUrl as an extra URL.
const frontendUrlContext = app.node.tryGetContext("frontendUrl");
const extraFrontendUrl = frontendUrlContext
  ? normalizeFrontendUrl(String(frontendUrlContext))
  : undefined;
const frontendUrl = useLocalDevStack
  ? "http://localhost:3000"
  : cloudFrontStack!.frontendWebsiteUrl;

if (
  !useLocalDevStack &&
  extraFrontendUrl &&
  !cdk.Token.isUnresolved(extraFrontendUrl) &&
  extraFrontendUrl.startsWith("http://")
) {
  throw new Error(
    `Production frontendUrl must use HTTPS for Cognito callbacks. Received: ${extraFrontendUrl}`,
  );
}

const normalizedFrontendUrl = normalizeFrontendUrl(frontendUrl);
const cognitoFrontendUrls =
  !useLocalDevStack && extraFrontendUrl
    ? [normalizedFrontendUrl, extraFrontendUrl]
    : [normalizedFrontendUrl];
const authCallbackUrls = cognitoFrontendUrls.map(
  (url) => `${url}/auth/callback`,
);

const googleClientIdContext = app.node.tryGetContext("googleClientId");
const googleClientSecretContext = app.node.tryGetContext("googleClientSecret");
const googleClientId = googleClientIdContext
  ? String(googleClientIdContext)
  : process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = googleClientSecretContext
  ? cdk.SecretValue.unsafePlainText(String(googleClientSecretContext))
  : process.env.GOOGLE_CLIENT_SECRET
    ? cdk.SecretValue.unsafePlainText(process.env.GOOGLE_CLIENT_SECRET)
    : undefined;
const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const applicationS3Stack = new ApplicationS3Stack(app, "ApplicationS3Stack", {
  env: stackEnv,
  frontendUrl: normalizedFrontendUrl,
  retainStatefulResouces,
});

// Created only in local dev stack mode (useLocalDevStack=true).
const devLambdaReplayStack = useLocalDevStack
  ? new DevLambdaReplayStack(app, "DevLambdaReplayStack", {
      env: stackEnv,
    })
  : undefined;

// Created only in production cloud stack mode (useLocalDevStack=false).
const rdsStack = !useLocalDevStack
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
    useLocalDevStack,
    skipEmailVerification,
    replayBucketName: devLambdaReplayStack?.bucket.bucketName,
    replayQueueUrl: devLambdaReplayStack?.queue.queueUrl,
    replayBucket: devLambdaReplayStack?.bucket,
    // If RDS is not created, the async function will fall back to its local/runtime env flow.
    primaryDatabaseSecretArn: rdsStack?.credentialsSecretArn,
  },
);
if (devLambdaReplayStack) {
  asynchronousLambdaFunctionsStack.addDependency(devLambdaReplayStack);
}

// Create Cognito User Pool + Client + Identity Pool
const cognitoStack = new CognitoStack(app, "CognitoStack", {
  env: stackEnv,
  useLocalDevStack,
  retainStatefulResouces,
  skipEmailVerification,
  googleClientId,
  googleClientSecret,
  callbackUrls: authCallbackUrls,
  logoutUrls: cognitoFrontendUrls,
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
    applicationDataBucket: applicationS3Stack.applicationDataBucket,
    stripePublishableKey,
    stripeSecretKey,
  },
);
synchronousLambdaFunctionsStack.addDependency(cognitoStack);
synchronousLambdaFunctionsStack.addDependency(applicationS3Stack);

// Created only in production cloud stack mode (useLocalDevStack=false).
const ecsServicesStack =
  !useLocalDevStack && enableEcsStack
    ? new EcsServicesStack(app, "EcsServicesStack", {
        env: stackEnv,
      })
    : undefined;

// Create API stack ** API Gateway with Lambda and ECS integrations
// Created only in production cloud stack mode (useLocalDevStack=false).
const httpApiGatewayStack = !useLocalDevStack
  ? new HttpApiGatewayStack(app, "HttpApiGatewayStack", {
      env: stackEnv,
      frontendUrl,
      useLocalDevStack,

      // User Pool Authorizer
      httpUserPoolAuthorizerConfig:
        synchronousLambdaFunctionsStack.httpUserPoolAuthorizerConfig,

      // Lambda integrations
      signInFn: synchronousLambdaFunctionsStack.signInFn,
      signOutFn: synchronousLambdaFunctionsStack.signOutFn,
      oauthCallbackFn: synchronousLambdaFunctionsStack.oauthCallbackFn,
      verifySessionFn: synchronousLambdaFunctionsStack.verifySessionFn,
      refreshFn: synchronousLambdaFunctionsStack.refreshFn,
      getUserFn: synchronousLambdaFunctionsStack.getUserFn,
      graphqlApiFn: synchronousLambdaFunctionsStack.graphqlApiFn,
      s3AccessBrokerFn: synchronousLambdaFunctionsStack.s3AccessBrokerFn,
      billingListProductsFn:
        synchronousLambdaFunctionsStack.billingListProductsFn,
      billingCreateSetupIntentFn:
        synchronousLambdaFunctionsStack.billingCreateSetupIntentFn,
      billingCreateSubscriptionFn:
        synchronousLambdaFunctionsStack.billingCreateSubscriptionFn,
      stripeWebhookFn: synchronousLambdaFunctionsStack.stripeWebhookFn,
      // <LambdaFunctionName>: synchronousLambdaFunctionsStack.<LambdaFunctionExport>,

      // ECS integrations
      langgraphServiceUrl: ecsServicesStack?.langgraphServiceUrl,
      // <ECSServiceURL>: ecsServicesStack?.<ecsServiceURL>,
    })
  : undefined;

// API Gateway dependencies (production cloud stack mode only)
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
