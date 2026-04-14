import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";

export class ApiGatewayLambdaFunctionsStack extends cdk.Stack {
  public readonly signIn: nodejs.NodejsFunction;
  public readonly verifyUser: nodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
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
    });
  }
}
