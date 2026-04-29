import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";

export interface WebSocketLambdaFunctionsStackProps extends cdk.StackProps {
  apiId?: string;
  stageName?: string;
  userPoolId: string;
  userPoolClientId: string;
}

export class WebSocketLambdaFunctionsStack extends cdk.Stack {
  public readonly connectFn: nodejs.NodejsFunction;
  public readonly customActionFn: nodejs.NodejsFunction;
  public readonly disconnectFn: nodejs.NodejsFunction;
  public readonly defaultFn: nodejs.NodejsFunction;
  public readonly authorizerFn: nodejs.NodejsFunction;

  constructor(
    scope: Construct,
    id: string,
    props: WebSocketLambdaFunctionsStackProps,
  ) {
    super(scope, id, props);

    // Connect Route Handler
    this.connectFn = new nodejs.NodejsFunction(this, "ConnectRouteFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(
        __dirname,
        "..",
        "lambda_functions",
        "ws-connect-route",
        "index.ts",
      ),
      handler: "lambdaHandler",
      bundling: {
        minify: true,
        target: "es2020",
        sourceMap: true,
      },
      timeout: cdk.Duration.seconds(3),
      memorySize: 128,
      environment: {
        PRODUCTION: "true",
      },
    });

    // Custom Action Route Handler (needs API management permissions)
    this.customActionFn = new nodejs.NodejsFunction(
      this,
      "CustomActionRouteFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "..",
          "lambda_functions",
          "ws-customAction-route",
          "index.ts",
        ),
        handler: "lambdaHandler",
        bundling: {
          minify: true,
          target: "es2020",
          sourceMap: true,
        },
        timeout: cdk.Duration.seconds(3),
        memorySize: 128,
        environment: {
          PRODUCTION: "true",
          ...(props.apiId && { API_ID: props.apiId }),
          ...(props.stageName && { STAGE: props.stageName }),
        },
      },
    );

    // Grant permission to manage connections
    if (props.apiId && props.stageName) {
      this.customActionFn.addToRolePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["execute-api:ManageConnections"],
          resources: [
            `arn:aws:execute-api:${this.region}:${this.account}:${props.apiId}/${props.stageName}/*`,
          ],
        }),
      );
    }

    // Disconnect Route Handler
    this.disconnectFn = new nodejs.NodejsFunction(
      this,
      "DisconnectRouteFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "..",
          "lambda_functions",
          "ws-disconnect-route",
          "index.ts",
        ),
        handler: "lambdaHandler",
        bundling: {
          minify: true,
          target: "es2020",
          sourceMap: true,
        },
        timeout: cdk.Duration.seconds(3),
        memorySize: 128,
        environment: {
          PRODUCTION: "true",
        },
      },
    );

    // Default Route Handler (needs API management permissions)
    this.defaultFn = new nodejs.NodejsFunction(this, "DefaultRouteFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(
        __dirname,
        "..",
        "lambda_functions",
        "ws-default-route",
        "index.ts",
      ),
      handler: "lambdaHandler",
      bundling: {
        minify: true,
        target: "es2020",
        sourceMap: true,
      },
      timeout: cdk.Duration.seconds(3),
      memorySize: 128,
      environment: {
        PRODUCTION: "true",
        ...(props.apiId && { API_ID: props.apiId }),
        ...(props.stageName && { STAGE: props.stageName }),
      },
    });

    // Grant permission to manage connections
    if (props.apiId && props.stageName) {
      this.defaultFn.addToRolePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["execute-api:ManageConnections"],
          resources: [
            `arn:aws:execute-api:${this.region}:${this.account}:${props.apiId}/${props.stageName}/*`,
          ],
        }),
      );
    }

    // Authorizer Function
    this.authorizerFn = new nodejs.NodejsFunction(this, "AuthorizerFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(
        __dirname,
        "..",
        "lambda_functions",
        "ws-authorizer",
        "index.ts",
      ),
      handler: "lambdaHandler",
      bundling: {
        minify: true,
        target: "es2020",
        sourceMap: true,
      },
      timeout: cdk.Duration.seconds(3),
      memorySize: 128,
      environment: {
        PRODUCTION: "true",
        USER_POOL_ID: props.userPoolId,
        USER_POOL_CLIENT_ID: props.userPoolClientId,
      },
    });

    // Outputs
    new cdk.CfnOutput(this, "ConnectRouteFunctionArn", {
      value: this.connectFn.functionArn,
    });
    new cdk.CfnOutput(this, "CustomActionRouteFunctionArn", {
      value: this.customActionFn.functionArn,
    });
    new cdk.CfnOutput(this, "DisconnectRouteFunctionArn", {
      value: this.disconnectFn.functionArn,
    });
    new cdk.CfnOutput(this, "DefaultRouteFunctionArn", {
      value: this.defaultFn.functionArn,
    });
    new cdk.CfnOutput(this, "AuthorizerFunctionArn", {
      value: this.authorizerFn.functionArn,
    });
  }
}
