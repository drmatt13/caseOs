import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as path from "path";

export interface HttpUserPoolAuthorizerConfig {
  userPoolId: string;
  userPoolClientId: string;
}

export interface SynchronousLambdaFunctionsStackProps extends cdk.StackProps {
  userPoolId: string;
  userPoolClientId: string;
  userPoolDomainUrl: string;
  primaryDatabaseSecretArn?: string;
}

export class SynchronousLambdaFunctionsStack extends cdk.Stack {
  public readonly signInFn: nodejs.NodejsFunction;
  public readonly signOutFn: nodejs.NodejsFunction;
  public readonly oauthCallbackFn: nodejs.NodejsFunction;
  public readonly verifyUserFn: nodejs.NodejsFunction;
  public readonly refreshFn: nodejs.NodejsFunction;
  public readonly getUserFn: nodejs.NodejsFunction;
  public readonly httpUserPoolAuthorizerConfig: HttpUserPoolAuthorizerConfig;

  constructor(
    scope: Construct,
    id: string,
    props: SynchronousLambdaFunctionsStackProps,
  ) {
    super(scope, id, props);

    this.httpUserPoolAuthorizerConfig = {
      userPoolId: props.userPoolId,
      userPoolClientId: props.userPoolClientId,
    };

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

    this.oauthCallbackFn = new nodejs.NodejsFunction(this, "OAuthCallback", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(
        __dirname,
        "..",
        "lambda_functions",
        "oauth-callback",
        "index.ts",
      ),
      handler: "lambdaHandler",
      bundling: {
        minify: true,
        sourceMap: true,
        target: "es2020",
        commandHooks: {
          beforeInstall() {
            return [];
          },
          beforeBundling() {
            return ["npm run generate --workspace @repo/database"];
          },
          afterBundling() {
            return [];
          },
        },
      },
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        USER_POOL_ID: props.userPoolId,
        USER_POOL_CLIENT_ID: props.userPoolClientId,
        COGNITO_DOMAIN_URL: props.userPoolDomainUrl,
        ...(props.primaryDatabaseSecretArn
          ? {
              PRIMARY_DATABASE_SECRET_ARN: props.primaryDatabaseSecretArn,
            }
          : {}),
      },
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
        USER_POOL_ID: props.userPoolId,
        USER_POOL_CLIENT_ID: props.userPoolClientId,
      },
    });

    this.getUserFn = new nodejs.NodejsFunction(this, "GetUser", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(
        __dirname,
        "..",
        "lambda_functions",
        "get-user",
        "index.ts",
      ),
      handler: "lambdaHandler",
      bundling: {
        minify: true,
        sourceMap: false,
        target: "es2020",
        commandHooks: {
          beforeInstall() {
            return [];
          },
          beforeBundling() {
            return ["npm run generate --workspace @repo/database"];
          },
          afterBundling() {
            return [];
          },
        },
      },
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        USER_POOL_ID: props.userPoolId,
        ...(props.primaryDatabaseSecretArn
          ? {
              PRIMARY_DATABASE_SECRET_ARN: props.primaryDatabaseSecretArn,
            }
          : {}),
      },
    });

    if (props.primaryDatabaseSecretArn) {
      const primaryDatabaseCredentialsSecret =
        secretsmanager.Secret.fromSecretCompleteArn(
        this,
        "SynchronousPrimaryDatabaseCredentialsSecret",
        props.primaryDatabaseSecretArn,
      );

      primaryDatabaseCredentialsSecret.grantRead(this.getUserFn);
      primaryDatabaseCredentialsSecret.grantRead(this.oauthCallbackFn);
    }

    // Outputs
    new cdk.CfnOutput(this, "SignInLambdaArn", {
      value: this.signInFn.functionArn,
      exportName: "SynchronousLambdaFunctionsStack:SignInFnLambdaArn",
    });

    new cdk.CfnOutput(this, "SignOutLambdaArn", {
      value: this.signOutFn.functionArn,
      exportName: "SynchronousLambdaFunctionsStack:SignOutFnLambdaArn",
    });

    new cdk.CfnOutput(this, "OAuthCallbackLambdaArn", {
      value: this.oauthCallbackFn.functionArn,
      exportName: "SynchronousLambdaFunctionsStack:OAuthCallbackFnLambdaArn",
    });

    new cdk.CfnOutput(this, "VerifyUserLambdaArn", {
      value: this.verifyUserFn.functionArn,
      exportName: "SynchronousLambdaFunctionsStack:VerifyUserFnLambdaArn",
    });

    new cdk.CfnOutput(this, "RefreshLambdaArn", {
      value: this.refreshFn.functionArn,
      exportName: "SynchronousLambdaFunctionsStack:RefreshFnLambdaArn",
    });

    new cdk.CfnOutput(this, "GetUserLambdaArn", {
      value: this.getUserFn.functionArn,
      exportName: "SynchronousLambdaFunctionsStack:GetUserFnLambdaArn",
    });
  }
}
