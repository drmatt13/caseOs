#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CognitoLambdaFunctionsStack } from "../lib/cognito-lambda-functions-stack";
import { CognitoStack } from "../lib/cognito-stack";
import { ApiGatewayLambdaFunctionsStack } from "../lib/api-gateway-lambda-functions-stack";
// import { EcsStack } from "../lib/ecs-stack";
import { ApiStack } from "../lib/api-stack";

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
const frontendUrl =
  app.node.tryGetContext("frontendUrl") ??
  process.env.FRONTEND_URL ??
  "http://localhost:3000";

// Create Cognito Lambda Functions Stack
const cognitoLambdaFunctionsStack = new CognitoLambdaFunctionsStack(
  app,
  "CognitoLambdaFunctionsStack",
  {
    env: stackEnv,
    frontendUrl,
  },
);

// Create Cognito User Pool + Client + Identity Pool
const cognitoStack = new CognitoStack(app, "CognitoStack", {
  env: stackEnv,
  isProduction,
  googleClientId: undefined,
  googleClientSecret: undefined,
  cognitoLambdaFunctionsStack,
});
cognitoStack.addDependency(cognitoLambdaFunctionsStack);

// Create API Gateway Lambda Functions Stack
const apiGatewayLambdaFunctionsStack = new ApiGatewayLambdaFunctionsStack(
  app,
  "ApiGatewayLambdaFunctionsStack",
  {
    env: stackEnv,
    userPoolId: cognitoStack.userPoolId,
    userPoolClientId: cognitoStack.userPoolClientId,
  },
);
apiGatewayLambdaFunctionsStack.addDependency(cognitoStack);

// Create ECS stack next (without API details) ** ECS Containers
// const ecsStack = new EcsStack(app, "EcsStack", {
//   env: stackEnv,
// });

// Create API stack ** API Gateway with Lambda and ECS integrations
const apiStack = new ApiStack(app, "ApiStack", {
  env: stackEnv,
  signIn: apiGatewayLambdaFunctionsStack.signIn,
  signOut: apiGatewayLambdaFunctionsStack.signOut,
  verifyUser: apiGatewayLambdaFunctionsStack.verifyUser,
  frontendUrl,
  // testContainer1Url: ecsStack.testContainer1Url,
  // testContainer2Url: ecsStack.testContainer2Url,
});

apiStack.addDependency(apiGatewayLambdaFunctionsStack);
// apiStack.addDependency(ecsStack);
