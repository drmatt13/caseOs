import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";

export interface SynchronousLambdaFunctionsStackProps extends cdk.StackProps {
  userPoolId: string;
  userPoolClientId: string;
}

export class SynchronousLambdaFunctionsStack extends cdk.Stack {
  public readonly signInFn: nodejs.NodejsFunction;
  public readonly signOutFn: nodejs.NodejsFunction;
  public readonly verifyUserFn: nodejs.NodejsFunction;
  public readonly refreshFn: nodejs.NodejsFunction;

  constructor(
    scope: Construct,
    id: string,
    props: SynchronousLambdaFunctionsStackProps,
  ) {
    super(scope, id, props);

    this.signInFn = new nodejs.NodejsFunction(this, "SignIn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(
        __dirname,
        "..",
        "lambda_functions",
        "sign-in",
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
      environment: {
        USER_POOL_ID: props.userPoolId,
        USER_POOL_CLIENT_ID: props.userPoolClientId,
      },
    });

    this.signOutFn = new nodejs.NodejsFunction(this, "SignOut", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(
        __dirname,
        "..",
        "lambda_functions",
        "sign-out",
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
    });

    this.verifyUserFn = new nodejs.NodejsFunction(this, "VerifyUser", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(
        __dirname,
        "..",
        "lambda_functions",
        "verify-user",
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
      environment: {
        USER_POOL_ID: props.userPoolId,
        USER_POOL_CLIENT_ID: props.userPoolClientId,
      },
    });

    this.refreshFn = new nodejs.NodejsFunction(this, "Refresh", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(
        __dirname,
        "..",
        "lambda_functions",
        "refresh",
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
      environment: {
        USER_POOL_CLIENT_ID: props.userPoolClientId,
      },
    });

    // Outputs
    new cdk.CfnOutput(this, "SignInLambdaArn", {
      value: this.signInFn.functionArn,
      exportName: "SynchronousLambdaFunctionsStack:SignInFnLambdaArn",
    });

    new cdk.CfnOutput(this, "SignOutLambdaArn", {
      value: this.signOutFn.functionArn,
      exportName: "SynchronousLambdaFunctionsStack:SignOutFnLambdaArn",
    });

    new cdk.CfnOutput(this, "VerifyUserLambdaArn", {
      value: this.verifyUserFn.functionArn,
      exportName: "SynchronousLambdaFunctionsStack:VerifyUserFnLambdaArn",
    });

    new cdk.CfnOutput(this, "RefreshLambdaArn", {
      value: this.refreshFn.functionArn,
      exportName: "SynchronousLambdaFunctionsStack:RefreshFnLambdaArn",
    });
  }
}
