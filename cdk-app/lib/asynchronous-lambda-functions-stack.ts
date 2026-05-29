import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as path from "path";
import {
  makePrismaClientCommandHooks,
  makePrismaLambdaEnvironment,
} from "./prisma-lambda-bundling";

// Resolve repo root so Docker bundling can use the root lockfile and correctly
// install workspace packages (e.g. @repo/shared-lambda-utils) when running
// inside the linux/docker bundling image.
const repoRoot = path.join(__dirname, "..", "..");

// Build bundling options as `any` to avoid TS errors for runtime-only fields
// (depsLockFilePath) while preserving type-checked defaults.
function makeBundlingOptions(
  override: Partial<nodejs.BundlingOptions> = {},
): any {
  return Object.assign(
    {
      minify: true,
      sourceMap: true,
      target: "es2020",
      depsLockFilePath: path.join(repoRoot, "package-lock.json"),
    },
    override,
  );
}

export interface AsynchronousLambdaFunctionsStackProps extends cdk.StackProps {
  frontendUrl?: string;
  useLocalDevStack?: boolean;
  skipEmailVerification?: boolean;
  replayBucketName?: string;
  replayQueueUrl?: string;
  replayBucket?: s3.IBucket;
  lambdaArchitecture: lambda.Architecture;
  prismaBinaryTarget: string;
  primaryDatabaseSecretArn?: string;
}

export class AsynchronousLambdaFunctionsStack extends cdk.Stack {
  public readonly cognitoPreSignUpTriggerFn: nodejs.NodejsFunction;
  public readonly cognitoCustomMessageFn: nodejs.NodejsFunction;
  public readonly cognitoPostConfirmationTriggerFn: nodejs.NodejsFunction;

  constructor(
    scope: Construct,
    id: string,
    props?: AsynchronousLambdaFunctionsStackProps,
  ) {
    super(scope, id, props);

    const frontendUrl = props?.frontendUrl;
    const useLocalDevStack = props?.useLocalDevStack ?? true;
    const skipEmailVerification = props?.skipEmailVerification ?? false;
    const replayBucketName = props?.replayBucketName ?? "default-bucket-name";
    const replayQueueUrl = props?.replayQueueUrl ?? "default-queue-url";
    const lambdaArchitecture =
      props?.lambdaArchitecture ?? lambda.Architecture.X86_64;
    const prismaBinaryTarget =
      props?.prismaBinaryTarget ?? "rhel-openssl-3.0.x";
    const prismaClientCommandHooks =
      makePrismaClientCommandHooks(prismaBinaryTarget);
    const prismaLambdaEnvironment =
      makePrismaLambdaEnvironment(prismaBinaryTarget);

    // Lambda function for pre-signup actions in Cognito
    this.cognitoPreSignUpTriggerFn = new nodejs.NodejsFunction(
      this,
      "CognitoPreSignUpTrigger",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        architecture: lambdaArchitecture,
        entry: path.join(
          __dirname,
          "..",
          "lambda_functions",
          "cognito-pre-signup-trigger",
          "index.ts",
        ),
        handler: "lambdaHandler",
        bundling: makeBundlingOptions(),
        environment: {
          SKIP_EMAIL_VERIFICATION: skipEmailVerification ? "true" : "false",
        },
        memorySize: 128,
        timeout: cdk.Duration.seconds(10),
      },
    );

    // Lambda function for customizing Cognito messages (e.g., verification emails)
    this.cognitoCustomMessageFn = new nodejs.NodejsFunction(
      this,
      "CognitoCustomMessage",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        architecture: lambdaArchitecture,
        entry: path.join(
          __dirname,
          "..",
          "lambda_functions",
          "cognito-custom-message",
          "index.ts",
        ),
        handler: "lambdaHandler",
        bundling: makeBundlingOptions(),
        environment: {
          FRONTEND_URL: frontendUrl ?? "",
        },
        memorySize: 128,
        timeout: cdk.Duration.seconds(10),
      },
    );

    // Lambda function for post-confirmation actions in Cognito
    this.cognitoPostConfirmationTriggerFn = new nodejs.NodejsFunction(
      this,
      "CognitoPostConfirmationTrigger",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        architecture: lambdaArchitecture,
        entry: path.join(
          __dirname,
          "..",
          "lambda_functions",
          "cognito-post-confirmation-trigger",
          "index.ts",
        ),
        handler: "lambdaHandler",
        bundling: makeBundlingOptions({
          sourceMap: false,
          commandHooks: prismaClientCommandHooks,
        }),
        environment: {
          ...prismaLambdaEnvironment,
          USE_LOCAL_DEV_STACK: useLocalDevStack ? "true" : "false",
          DEV_LAMBDA_REPLAY_BUCKET_NAME: replayBucketName,
          DEV_LAMBDA_REPLAY_QUEUE_URL: replayQueueUrl,
          ...(props?.primaryDatabaseSecretArn
            ? {
                PRIMARY_DATABASE_SECRET_ARN: props.primaryDatabaseSecretArn,
              }
            : {}),
        },
        memorySize: 512,
        timeout: cdk.Duration.seconds(30),
      },
    );

    if (useLocalDevStack && props?.replayBucket) {
      props.replayBucket.grantWrite(this.cognitoPostConfirmationTriggerFn);
    }

    if (props?.primaryDatabaseSecretArn) {
      secretsmanager.Secret.fromSecretCompleteArn(
        this,
        "PrimaryDatabaseCredentialsSecret",
        props.primaryDatabaseSecretArn,
      ).grantRead(this.cognitoPostConfirmationTriggerFn);
    }

    // Outputs
    new cdk.CfnOutput(this, "CognitoPreSignUpTriggerLambdaArn", {
      value: this.cognitoPreSignUpTriggerFn.functionArn,
      exportName: `${this.stackName}:CognitoPreSignUpTriggerLambdaArn`,
    });
    new cdk.CfnOutput(this, "CognitoCustomMessageLambdaArn", {
      value: this.cognitoCustomMessageFn.functionArn,
      exportName: `${this.stackName}:CognitoCustomMessageLambdaArn`,
    });
    new cdk.CfnOutput(this, "CognitoPostConfirmationTriggerLambdaArn", {
      value: this.cognitoPostConfirmationTriggerFn.functionArn,
      exportName: `${this.stackName}:CognitoPostConfirmationTriggerLambdaArn`,
    });
  }
}
