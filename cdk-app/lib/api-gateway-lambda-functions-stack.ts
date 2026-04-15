import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";

export interface ApiGatewayLambdaFunctionsStackProps extends cdk.StackProps {
  userPoolId: string;
  userPoolClientId: string;
}

export class ApiGatewayLambdaFunctionsStack extends cdk.Stack {
  public readonly signIn: nodejs.NodejsFunction;
  public readonly signOut: nodejs.NodejsFunction;
  public readonly verifyUser: nodejs.NodejsFunction;

  constructor(
    scope: Construct,
    id: string,
    props: ApiGatewayLambdaFunctionsStackProps,
  ) {
    super(scope, id, props);

    this.signIn = new nodejs.NodejsFunction(this, "SignIn", {
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

    this.signOut = new nodejs.NodejsFunction(this, "SignOut", {
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

    this.verifyUser = new nodejs.NodejsFunction(this, "VerifyUser", {
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
  }
}
