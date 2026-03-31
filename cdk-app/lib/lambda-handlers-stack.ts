import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";

export class LambdaHandlersStack extends cdk.Stack {
  public readonly testFunction1: nodejs.NodejsFunction;
  public readonly testFunction2: nodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.testFunction1 = new nodejs.NodejsFunction(this, "TestFunction1", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(
        __dirname,
        "..",
        "lambda_functions",
        "test-function-1",
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

    this.testFunction2 = new nodejs.NodejsFunction(this, "TestFunction2", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(
        __dirname,
        "..",
        "lambda_functions",
        "test-function-2",
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
