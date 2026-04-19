import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as path from "path";

export interface AsynchronousLambdaFunctionsStackProps extends cdk.StackProps {
  frontendUrl?: string;
  useLocalImplementations?: boolean;
  replayBucketName?: string;
  replayQueueUrl?: string;
  replayBucket?: s3.IBucket;
  primaryDatabaseUrl?: string;
}

export class AsynchronousLambdaFunctionsStack extends cdk.Stack {
  public readonly cognitoPreSignUpTrigger: nodejs.NodejsFunction;
  public readonly cognitoCustomMessage: nodejs.NodejsFunction;
  public readonly cognitoPostConfirmationTrigger: nodejs.NodejsFunction;

  constructor(
    scope: Construct,
    id: string,
    props?: AsynchronousLambdaFunctionsStackProps,
  ) {
    super(scope, id, props);

    const frontendUrl = props?.frontendUrl ?? "http://localhost:3000";
    const useLocalImplementations = props?.useLocalImplementations ?? true;
    const replayBucketName = props?.replayBucketName ?? "default-bucket-name";
    const replayQueueUrl = props?.replayQueueUrl ?? "default-queue-url";

    // Lambda function for pre-signup actions in Cognito
    this.cognitoPreSignUpTrigger = new nodejs.NodejsFunction(
      this,
      "CognitoPreSignUpTrigger",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "..",
          "lambda_functions",
          "cognito-pre-signup-trigger",
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

    // Lambda function for customizing Cognito messages (e.g., verification emails)
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
        environment: {
          USE_LOCAL_IMPLEMENTATIONS: useLocalImplementations ? "true" : "false",
          DEV_LAMBDA_REPLAY_BUCKET_NAME: replayBucketName,
          DEV_LAMBDA_REPLAY_QUEUE_URL: replayQueueUrl,
          ...(props?.primaryDatabaseUrl
            ? { PRIMARY_DATABASE_URL: props.primaryDatabaseUrl }
            : {}),
        },
        memorySize: 128,
        timeout: cdk.Duration.seconds(10),
      },
    );

    if (useLocalImplementations && props?.replayBucket) {
      props.replayBucket.grantWrite(this.cognitoPostConfirmationTrigger);
    }
  }
}
