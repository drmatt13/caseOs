#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { execSync } from "child_process";
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
import { FrontendWebsiteS3Stack } from "../lib/frontend-website-s3-stack";
import { ApplicationS3Stack } from "../lib/application-s3-stack";

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

const app = new cdk.App();

const optionalString = (value: unknown) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const stringValue = String(value);
  return stringValue.trim() ? stringValue : undefined;
};

const lambdaArchitectureValue = (
  optionalString(app.node.tryGetContext("lambdaArchitecture")) ??
  optionalString(process.env.LAMBDA_ARCHITECTURE) ??
  "x86_64"
).toLowerCase();

const lambdaArchitectureConfig =
  lambdaArchitectureValue === "arm64"
    ? {
        cdkArchitecture: lambda.Architecture.ARM_64,
        prismaBinaryTarget: "linux-arm64-openssl-3.0.x",
      }
    : lambdaArchitectureValue === "x86_64"
      ? {
          cdkArchitecture: lambda.Architecture.X86_64,
          prismaBinaryTarget: "rhel-openssl-3.0.x",
        }
      : undefined;

if (!lambdaArchitectureConfig) {
  throw new Error(
    `LAMBDA_ARCHITECTURE/lambdaArchitecture must be "x86_64" or "arm64". Received: ${lambdaArchitectureValue}`,
  );
}

const runDatabaseGenerate = (prismaBinaryTarget: string) => {
  execSync("npm run generate --workspace @repo/database", {
    cwd: path.join(__dirname, "..", ".."),
    env: {
      ...process.env,
      PRISMA_BINARY_TARGETS: JSON.stringify([prismaBinaryTarget]),
    },
    stdio: "inherit",
  });
};

// Lambda bundles import generated Prisma/Pothos output. Generate once before
// CDK constructs create any NodejsFunction assets.
runDatabaseGenerate(lambdaArchitectureConfig.prismaBinaryTarget);

// Context Flags (with defaults)
//
// -c useLocalDevStack              (default: true)
// -c enableRdsProxy                (default: false, also disabled when useLocalDevStack=true)
// -c skipEmailVerification         (default: false, forced true when no prodUrl/PROD_URL is configured)
// -c enableEcsStack                (default: false)
// -c enableWebSockets              (default: false)
// -c useCustomWsAuthorizer         (default: false)
// -c lambdaArchitecture            (default: LAMBDA_ARCHITECTURE from .env, fallback: x86_64; values: x86_64, arm64)
// -c retainStatefulResources       (default: false) - Cognito, RDS, Secrets
//
// -c cdkAppName                    (default: CDK_APP_NAME from .env, fallback: matts-aws-cdk-dev-kit)
// -c prodUrl                       (default: PROD_URL from .env)
// -c prodCertificateArn            (default: PROD_CERTIFICATE_ARN from .env, required when prodUrl is configured)
// -c localDevUrl                   (default: LOCAL_DEV_URL from .env, fallback: http://localhost:3000 in local mode)
// -c cognitoDomainPrefix           (default: COGNITO_DOMAIN_PREFIX from .env, fallback: cdkAppName)
// -c googleClientId                (default: GOOGLE_CLIENT_ID from .env)
// -c googleClientSecret            (default: GOOGLE_CLIENT_SECRET from .env)
// -c stripePublishableKey          (default: STRIPE_PUBLISHABLE_KEY from .env)
// -c stripeSecretKey               (default: STRIPE_SECRET_KEY from .env)

// Complete Synth:
// cdk synth --all -c useLocalDevStack=false -c enableRdsProxy=true -c skipEmailVerification=false -c useCustomWsAuthorizer=true -c enableWebSockets=true

// Current DEV deployment:
// cdk deploy --all -c useCustomWsAuthorizer=true -c enableWebSockets=true -c skipEmailVerification=true --require-approval never

// Current PROD deployment:
// cdk deploy --all -c useLocalDevStack=false -c prodCertificateArn=arn:aws:acm:us-east-1:<account-id>:certificate/<certificate-id> -c localDevUrl=http://localhost:3000 -c useCustomWsAuthorizer=true -c enableWebSockets=true -c enableEcsStack=false -c skipEmailVerification=true --require-approval never --profile=dev

// Frontend website bucket deployment:
// <build frontend assets in ../client-app/dist>
// aws s3 sync ../client-app/dist s3://<frontend-website-s3-bucket-name> --delete

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
const requestedSkipEmailVerification =
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

const normalizeFrontendUrl = (url: string) =>
  cdk.Token.isUnresolved(url) ? url : url.trim().replace(/\/+$/, "");

const deploymentNameContext = app.node.tryGetContext("cdkAppName");
const deploymentName =
  optionalString(deploymentNameContext) ??
  optionalString(process.env.CDK_APP_NAME) ??
  "matts-aws-cdk-dev-kit";

if (!/^[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(deploymentName)) {
  throw new Error(
    `cdkAppName/CDK_APP_NAME must be 1-63 lowercase letters, numbers, or hyphens, start with a letter, and not end with a hyphen. Received: ${deploymentName}`,
  );
}

const stackId = (baseName: string) => `${deploymentName}-${baseName}`;

const getDomainNameFromUrl = (url: string, label: string) => {
  const normalizedUrl = normalizeFrontendUrl(url);

  if (cdk.Token.isUnresolved(normalizedUrl)) {
    return undefined;
  }

  try {
    return new URL(normalizedUrl).hostname;
  } catch {
    throw new Error(`${label} must be an absolute URL. Received: ${url}`);
  }
};

const isLoopbackHttpUrl = (url: string) => {
  if (cdk.Token.isUnresolved(url) || !url.startsWith("http://")) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.hostname === "localhost" ||
      parsedUrl.hostname === "127.0.0.1" ||
      parsedUrl.hostname === "[::1]" ||
      parsedUrl.hostname === "::1"
    );
  } catch {
    return false;
  }
};

const assertValidTrustedFrontendUrl = (url: string) => {
  if (
    useLocalDevStack ||
    cdk.Token.isUnresolved(url) ||
    url.startsWith("https://") ||
    isLoopbackHttpUrl(url)
  ) {
    return;
  }

  throw new Error(
    `Production trusted frontend URLs must use HTTPS except for localhost testing URLs. Received: ${url}`,
  );
};

const dedupeFrontendUrls = (urls: string[]) => {
  const seenUrls = new Set<string>();
  const uniqueUrls: string[] = [];

  for (const url of urls) {
    const normalizedUrl = normalizeFrontendUrl(url);

    if (!normalizedUrl) {
      continue;
    }

    if (!cdk.Token.isUnresolved(normalizedUrl)) {
      if (seenUrls.has(normalizedUrl)) {
        continue;
      }

      seenUrls.add(normalizedUrl);
    }

    uniqueUrls.push(normalizedUrl);
  }

  return uniqueUrls;
};

// The primary frontend URL is used by email links and other single-URL
// consumers. It comes from prodUrl/PROD_URL in production, then falls back to
// the generated CloudFront URL in cloud mode. Localhost is represented by
// localDevUrl only.
const prodUrlContext = app.node.tryGetContext("prodUrl");
const configuredProdUrl =
  optionalString(prodUrlContext) ?? optionalString(process.env.PROD_URL);
const prodCertificateArnContext = app.node.tryGetContext("prodCertificateArn");
const configuredProdCertificateArn =
  optionalString(prodCertificateArnContext) ??
  optionalString(process.env.PROD_CERTIFICATE_ARN);
const localDevUrlContext = app.node.tryGetContext("localDevUrl");
const configuredLocalDevUrl =
  optionalString(localDevUrlContext) ??
  optionalString(process.env.LOCAL_DEV_URL);
const localDevUrl = configuredLocalDevUrl ?? "http://localhost:3000";

const prodDomainName = configuredProdUrl
  ? getDomainNameFromUrl(configuredProdUrl, "prodUrl/PROD_URL")
  : undefined;

if (!useLocalDevStack && prodDomainName && !configuredProdCertificateArn) {
  throw new Error(
    "prodCertificateArn/PROD_CERTIFICATE_ARN is required when prodUrl/PROD_URL is configured so CloudFront can attach the alternate domain name.",
  );
}

const frontendWebsiteS3Stack = new FrontendWebsiteS3Stack(
  app,
  stackId("FrontendWebsiteS3Stack"),
  {
    env: stackEnv,
    enableCloudFront: !useLocalDevStack,
    prodDomainName: !useLocalDevStack ? prodDomainName : undefined,
    prodCertificateArn: !useLocalDevStack
      ? configuredProdCertificateArn
      : undefined,
  },
);
const cloudFrontUrl = !useLocalDevStack
  ? frontendWebsiteS3Stack.cloudFrontUrl!
  : undefined;
const frontendUrl = configuredProdUrl ?? cloudFrontUrl;
const skipEmailVerification =
  requestedSkipEmailVerification || !configuredProdUrl;
const trustedFrontendUrls = dedupeFrontendUrls([
  ...(cloudFrontUrl ? [cloudFrontUrl] : []),
  ...(frontendUrl ? [frontendUrl] : []),
  ...(useLocalDevStack ? [localDevUrl] : []),
  ...(configuredLocalDevUrl ? [configuredLocalDevUrl] : []),
]);
trustedFrontendUrls.forEach(assertValidTrustedFrontendUrl);

const authCallbackUrls = trustedFrontendUrls.map(
  (url) => `${url}/auth/callback`,
);

const cognitoDomainPrefixContext = app.node.tryGetContext(
  "cognitoDomainPrefix",
);
const cognitoDomainPrefix =
  optionalString(cognitoDomainPrefixContext) ??
  optionalString(process.env.COGNITO_DOMAIN_PREFIX) ??
  deploymentName;

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
const stripePublishableKeyContext = app.node.tryGetContext(
  "stripePublishableKey",
);
const stripeSecretKeyContext = app.node.tryGetContext("stripeSecretKey");
const stripePublishableKey = stripePublishableKeyContext
  ? String(stripePublishableKeyContext)
  : process.env.STRIPE_PUBLISHABLE_KEY;
const stripeSecretKey = stripeSecretKeyContext
  ? String(stripeSecretKeyContext)
  : process.env.STRIPE_SECRET_KEY;

const applicationS3Stack = new ApplicationS3Stack(
  app,
  stackId("ApplicationS3Stack"),
  {
    env: stackEnv,
    deploymentName,
    frontendUrls: trustedFrontendUrls,
    retainStatefulResouces,
  },
);

// Created only in local dev stack mode (useLocalDevStack=true).
const devLambdaReplayStack = useLocalDevStack
  ? new DevLambdaReplayStack(app, stackId("DevLambdaReplayStack"), {
      env: stackEnv,
    })
  : undefined;

// Created only in production cloud stack mode (useLocalDevStack=false).
const rdsStack = !useLocalDevStack
  ? new RdsStack(app, stackId("RdsStack"), {
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
  stackId("AsynchronousLambdaFunctionsStack"),
  {
    env: stackEnv,
    frontendUrl,
    useLocalDevStack,
    skipEmailVerification,
    replayBucketName: devLambdaReplayStack?.bucket.bucketName,
    replayQueueUrl: devLambdaReplayStack?.queue.queueUrl,
    replayBucket: devLambdaReplayStack?.bucket,
    lambdaArchitecture: lambdaArchitectureConfig.cdkArchitecture,
    prismaBinaryTarget: lambdaArchitectureConfig.prismaBinaryTarget,
    // If RDS is not created, the async function will fall back to its local/runtime env flow.
    primaryDatabaseSecretArn: rdsStack?.credentialsSecretArn,
  },
);
if (devLambdaReplayStack) {
  asynchronousLambdaFunctionsStack.addDependency(devLambdaReplayStack);
}

// Create Cognito User Pool + Client + Identity Pool
const cognitoStack = new CognitoStack(app, stackId("CognitoStack"), {
  env: stackEnv,
  useLocalDevStack,
  retainStatefulResouces,
  skipEmailVerification,
  cognitoDomainPrefix,
  googleClientId,
  googleClientSecret,
  callbackUrls: authCallbackUrls,
  logoutUrls: trustedFrontendUrls,
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
  stackId("SynchronousLambdaFunctionsStack"),
  {
    env: stackEnv,
    userPoolId: cognitoStack.userPoolId,
    userPoolClientId: cognitoStack.userPoolClientId,
    userPoolDomainUrl: cognitoStack.userPoolDomainUrl,
    lambdaArchitecture: lambdaArchitectureConfig.cdkArchitecture,
    prismaBinaryTarget: lambdaArchitectureConfig.prismaBinaryTarget,
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
    ? new EcsServicesStack(app, stackId("EcsServicesStack"), {
        env: stackEnv,
        userPoolId: cognitoStack.userPoolId,
        userPoolClientId: cognitoStack.userPoolClientId,
        userPoolDomainUrl: cognitoStack.userPoolDomainUrl,
      })
    : undefined;

// Create API stack ** API Gateway with Lambda and ECS integrations
// Created only in production cloud stack mode (useLocalDevStack=false).
const httpApiGatewayStack = !useLocalDevStack
  ? new HttpApiGatewayStack(app, stackId("HttpApiGatewayStack"), {
      env: stackEnv,
      frontendUrls: trustedFrontendUrls,
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
  stackId("WebSocketLambdaFunctionsStack"),
  {
    env: stackEnv,
    userPoolId: cognitoStack.userPoolId,
    userPoolClientId: cognitoStack.userPoolClientId,
    lambdaArchitecture: lambdaArchitectureConfig.cdkArchitecture,
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
  ? new WebSocketApiStack(app, stackId("WebSocketApiStack"), {
      env: stackEnv,
      connectFn: webSocketLambdaFunctionsStack.connectFn,
      customActionFn: webSocketLambdaFunctionsStack.customActionFn,
      disconnectFn: webSocketLambdaFunctionsStack.disconnectFn,
      defaultFn: webSocketLambdaFunctionsStack.defaultFn,
      authorizerFn: webSocketLambdaFunctionsStack.authorizerFn,
      useCustomWsAuthorizer: useCustomWsAuthorizer,
    })
  : undefined;
