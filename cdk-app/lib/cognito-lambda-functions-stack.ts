import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";

export interface CognitoLambdaFunctionsStackProps extends cdk.StackProps {
  frontendUrl?: string;
}

export class CognitoLambdaFunctionsStack extends cdk.Stack {
  public readonly cognitoCustomMessage: nodejs.NodejsFunction;
  public readonly cognitoPostConfirmationTrigger: nodejs.NodejsFunction;

  constructor(
    scope: Construct,
    id: string,
    props?: CognitoLambdaFunctionsStackProps,
  ) {
    super(scope, id, props);

    const frontendUrl = props?.frontendUrl ?? "http://localhost:3000";

    // Lambda function for customizing Cognito messages
    this.cognitoCustomMessage = new nodejs.NodejsFunction(
      this,
      "CognitoCustomMessage",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "..",
          "lambda_functions",
          "cognito-custom-message",
          "index.ts",
        ),
        handler: "lambdaHandler",
        bundling: {
          minify: true,
          sourceMap: true,
          target: "es2020",
        },
        environment: {
          FRONTEND_URL: frontendUrl,
        },
        memorySize: 128,
        timeout: cdk.Duration.seconds(10),
      },
    );

    // Lambda function for post-confirmation actions in Cognito
    this.cognitoPostConfirmationTrigger = new nodejs.NodejsFunction(
      this,
      "CognitoPostConfirmationTrigger",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "..",
          "lambda_functions",
          "cognito-post-confirmation-trigger",
          "index.ts",
        ),
        handler: "lambdaHandler",
        bundling: {
          minify: true,
          sourceMap: true,
          target: "es2020",
        },
        memorySize: 128,
        timeout: cdk.Duration.seconds(10),
      },
    );
  }
}
