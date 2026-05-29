#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE_STACK_OUTPUT_MAPPINGS = {
  ApplicationS3Stack: {
    ApplicationDataBucketArn: "APPLICATION_DATA_BUCKET_ARN",
    ApplicationDataBucketName: "APPLICATION_DATA_BUCKET_NAME",
  },
  CognitoStack: {
    UserPoolId: "USER_POOL_ID",
    UserPoolClientId: "USER_POOL_CLIENT_ID",
    UserPoolDomainUrl: "COGNITO_DOMAIN_URL",
    OAuthProviderRedirectUri: "OAUTH_PROVIDER_REDIRECT_URI",
  },
  DevLambdaReplayStack: {
    ReplayBucketName: "DEV_LAMBDA_REPLAY_BUCKET_NAME",
    ReplayQueueUrl: "DEV_LAMBDA_REPLAY_QUEUE_URL",
    ReplayQueueArn: "DEV_LAMBDA_REPLAY_QUEUE_ARN",
  },
  FrontendWebsiteS3Stack: {
    FrontendWebsiteBucketName: "FRONTEND_WEBSITE_BUCKET_NAME",
    FrontendWebsiteBucketArn: "FRONTEND_WEBSITE_BUCKET_ARN",
    CloudFrontUrl: "CLOUDFRONT_URL",
    FrontendWebsiteUrl: "CLOUDFRONT_URL",
    CloudFrontDomainName: "CLOUDFRONT_DOMAIN_NAME",
    FrontendDistributionDomainName: "CLOUDFRONT_DOMAIN_NAME",
    CloudFrontId: "CLOUDFRONT_ID",
    FrontendDistributionId: "CLOUDFRONT_ID",
  },
  HttpApiGatewayStack: {
    HttpApiUrl: "HTTP_API_URL",
  },
  RdsStack: {
    RdsProxyEndpoint: "RDS_PROXY_ENDPOINT",
    RdsProxyEnabled: "RDS_PROXY_ENABLED",
    RdsProxyPort: "RDS_PROXY_PORT",
    RdsDatabaseEndpoint: "RDS_DATABASE_ENDPOINT",
    RdsPrimaryEndpoint: "RDS_PRIMARY_ENDPOINT",
    PrimaryDatabaseUrlTemplate: "PRIMARY_DATABASE_URL_TEMPLATE",
    DirectDatabaseUrlTemplate: "DIRECT_DATABASE_URL_TEMPLATE",
    RdsCredentialsSecretArn: "RDS_CREDENTIALS_SECRET_ARN",
  },
  WebSocketApiStack: {
    WebSocketAPIEndpoint: "VITE_API_GATEWAY_WS_URL",
  },
};

const GENERATED_BLOCK_START = "# BEGIN GENERATED CDK OUTPUTS";
const GENERATED_BLOCK_END = "# END GENERATED CDK OUTPUTS";

const args = new Map(
  process.argv.slice(2).flatMap((arg, index, allArgs) => {
    if (!arg.startsWith("--")) {
      return [];
    }

    const [key, inlineValue] = arg.slice(2).split("=", 2);
    const nextValue = allArgs[index + 1]?.startsWith("--")
      ? undefined
      : allArgs[index + 1];

    return [[key, inlineValue ?? nextValue ?? "true"]];
  }),
);

const getOption = (...names) => {
  for (const name of names) {
    const argValue = args.get(name);
    if (argValue !== undefined) {
      return argValue;
    }

    const npmConfigNames = [
      name,
      name.toLowerCase(),
      name.replace(/-/g, "_").toLowerCase(),
      name.replace(/[A-Z]/g, (letter) => letter.toLowerCase()),
      name
        .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
        .replace(/-/g, "_")
        .replace(/^_/, ""),
    ];

    for (const npmConfigName of npmConfigNames) {
      const envValue = process.env[`npm_config_${npmConfigName}`];
      if (envValue !== undefined) {
        return envValue;
      }
    }
  }

  return undefined;
};

const envPath = resolve(process.cwd(), getOption("env-file") ?? ".env");
const profile = getOption("profile") ?? process.env.AWS_PROFILE;
const region = getOption("region") ?? process.env.AWS_REGION;
const deploymentName =
  getOption("cdkAppName", "cdk-app-name") ??
  process.env.CDK_APP_NAME ??
  "matts-aws-cdk-dev-kit";

if (!/^[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(deploymentName)) {
  throw new Error(
    `--cdkAppName/--cdk-app-name/CDK_APP_NAME must be 1-63 lowercase letters, numbers, or hyphens, start with a letter, and not end with a hyphen. Received: ${deploymentName}`,
  );
}

const stackName = (baseName) => `${deploymentName}-${baseName}`;

const awsArgsBase = [];
if (profile) {
  awsArgsBase.push("--profile", profile);
}
if (region) {
  awsArgsBase.push("--region", region);
}

const runAws = (args) => {
  const output = execFileSync("aws", [...awsArgsBase, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  return JSON.parse(output);
};

const describeStackOutputs = (stackName) => {
  try {
    const response = runAws([
      "cloudformation",
      "describe-stacks",
      "--stack-name",
      stackName,
      "--output",
      "json",
    ]);

    return response.Stacks?.[0]?.Outputs ?? [];
  } catch (error) {
    const message = error.stderr?.toString().trim() || error.message;
    if (message.includes("does not exist")) {
      return [];
    }

    console.warn(`Skipping ${stackName}: ${message}`);
    return [];
  }
};

const normalizeWebSocketUrl = (url) => {
  const cleanUrl = url.replace(/^wss:\/\/wss:\/\//, "wss://");
  return cleanUrl.includes("?token=") ? cleanUrl : `${cleanUrl}?token=`;
};

const quoteEnvValue = (value) => {
  if (/^[A-Za-z0-9_./:@?=+-]*$/.test(value)) {
    return value;
  }

  return JSON.stringify(value);
};

const collectedEnv = new Map();

for (const [baseStackName, outputMappings] of Object.entries(
  BASE_STACK_OUTPUT_MAPPINGS,
)) {
  const outputs = describeStackOutputs(stackName(baseStackName));

  for (const output of outputs) {
    const envName = outputMappings[output.OutputKey];
    if (!envName || output.OutputValue === undefined) {
      continue;
    }

    const value =
      envName === "VITE_API_GATEWAY_WS_URL"
        ? normalizeWebSocketUrl(output.OutputValue)
        : output.OutputValue;

    collectedEnv.set(envName, value);
  }
}

const cognitoDomainUrl = collectedEnv.get("COGNITO_DOMAIN_URL");
if (cognitoDomainUrl) {
  collectedEnv.set(
    "AUTHORIZED_REDIRECT_URIS",
    `${cognitoDomainUrl.replace(/\/+$/, "")}/oauth2/idpresponse`,
  );
}

if (collectedEnv.size === 0) {
  throw new Error("No CDK outputs were found. Deploy the stacks first, then rerun this command.");
}

const generatedLines = [
  GENERATED_BLOCK_START,
  "# This block is generated by `npm run export:cdk-outputs`.",
  "# Do not edit values in this block manually.",
  ...[...collectedEnv.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${quoteEnvValue(value)}`),
  GENERATED_BLOCK_END,
  "",
];

const existingEnv = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
const generatedBlockPattern = new RegExp(
  `${GENERATED_BLOCK_START}[\\s\\S]*?${GENERATED_BLOCK_END}\\r?\\n?`,
);

const nextEnv = generatedBlockPattern.test(existingEnv)
  ? existingEnv.replace(generatedBlockPattern, generatedLines.join("\n"))
  : [existingEnv.trimEnd(), generatedLines.join("\n")]
      .filter(Boolean)
      .join("\n\n");

writeFileSync(envPath, nextEnv, "utf8");

console.log(`Wrote ${collectedEnv.size} CDK output values to ${envPath}`);
