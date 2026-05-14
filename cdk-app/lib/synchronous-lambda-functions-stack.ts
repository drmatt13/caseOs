import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
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
  caseOSBucket: s3.IBucket;
  stripePublishableKey?: string;
  stripeSecretKey?: string;
}

export class SynchronousLambdaFunctionsStack extends cdk.Stack {
  public readonly httpUserPoolAuthorizerConfig: HttpUserPoolAuthorizerConfig;
  public readonly signInFn: nodejs.NodejsFunction;
  public readonly signOutFn: nodejs.NodejsFunction;
  public readonly oauthCallbackFn: nodejs.NodejsFunction;
  public readonly verifySessionFn: nodejs.NodejsFunction;
  public readonly refreshFn: nodejs.NodejsFunction;
  public readonly getUserFn: nodejs.NodejsFunction;
  public readonly graphqlApiFn: nodejs.NodejsFunction;
  public readonly updateUserFn: nodejs.NodejsFunction;
  public readonly s3AccessBrokerFn: nodejs.NodejsFunction;

  // stripe functions
  public readonly billingListProductsFn: nodejs.NodejsFunction;
  public readonly billingCreateSetupIntentFn: nodejs.NodejsFunction;
  public readonly billingCreateSubscriptionFn: nodejs.NodejsFunction;
  public readonly stripeWebhookFn: nodejs.NodejsFunction;

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
        STRIPE_PUBLISHABLE_KEY: props.stripePublishableKey ?? "",
        STRIPE_SECRET_KEY: props.stripeSecretKey ?? "",
        ...(props.primaryDatabaseSecretArn
          ? {
              PRIMARY_DATABASE_SECRET_ARN: props.primaryDatabaseSecretArn,
            }
          : {}),
      },
    });

    this.verifySessionFn = new nodejs.NodejsFunction(this, "VerifySession", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(
        __dirname,
        "..",
        "lambda_functions",
        "verify-session",
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
        USER_POOL_CLIENT_ID: props.userPoolClientId,
        ...(props.primaryDatabaseSecretArn
          ? {
              PRIMARY_DATABASE_SECRET_ARN: props.primaryDatabaseSecretArn,
            }
          : {}),
      },
    });

    this.graphqlApiFn = new nodejs.NodejsFunction(this, "GraphQLApi", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(
        __dirname,
        "..",
        "lambda_functions",
        "graphql-api",
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
        USER_POOL_CLIENT_ID: props.userPoolClientId,
        ...(props.primaryDatabaseSecretArn
          ? {
              PRIMARY_DATABASE_SECRET_ARN: props.primaryDatabaseSecretArn,
            }
          : {}),
      },
    });

    this.s3AccessBrokerFn = new nodejs.NodejsFunction(this, "S3AccessBroker", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(
        __dirname,
        "..",
        "lambda_functions",
        "s3-access-broker",
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
        USER_POOL_CLIENT_ID: props.userPoolClientId,
        CASEOS_STORAGE_BUCKET_ARN: props.caseOSBucket.bucketArn,
        ...(props.primaryDatabaseSecretArn
          ? {
              PRIMARY_DATABASE_SECRET_ARN: props.primaryDatabaseSecretArn,
            }
          : {}),
      },
    });

    this.s3AccessBrokerFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
        ],
        resources: [
          props.caseOSBucket.bucketArn,
          `${props.caseOSBucket.bucketArn}/*`,
        ],
      }),
    );

    this.s3AccessBrokerFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["sts:GetFederationToken"],
        resources: ["*"],
      }),
    );

    if (props.primaryDatabaseSecretArn) {
      const primaryDatabaseCredentialsSecret =
        secretsmanager.Secret.fromSecretCompleteArn(
          this,
          "SynchronousPrimaryDatabaseCredentialsSecret",
          props.primaryDatabaseSecretArn,
        );

      primaryDatabaseCredentialsSecret.grantRead(this.getUserFn);
      primaryDatabaseCredentialsSecret.grantRead(this.graphqlApiFn);
      primaryDatabaseCredentialsSecret.grantRead(this.oauthCallbackFn);
      primaryDatabaseCredentialsSecret.grantRead(this.s3AccessBrokerFn);
      primaryDatabaseCredentialsSecret.grantRead(this.updateUserFn);
    }

    // Stripe functions
    this.billingListProductsFn = new nodejs.NodejsFunction(
      this,
      "BillingListProducts",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "..",
          "lambda_functions",
          "billing-list-products",
          "index.ts",
        ),
        handler: "lambdaHandler",
        bundling: {
          minify: true,
          sourceMap: true,
          target: "es2020",
        },
        memorySize: 256,
        timeout: cdk.Duration.seconds(15),
        environment: {
          USER_POOL_ID: props.userPoolId,
          USER_POOL_CLIENT_ID: props.userPoolClientId,
          STRIPE_SECRET_KEY: props.stripeSecretKey ?? "",
        },
      },
    );

    this.billingCreateSetupIntentFn = new nodejs.NodejsFunction(
      this,
      "BillingCreateSetupIntent",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "..",
          "lambda_functions",
          "billing-create-setup-intent",
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
          STRIPE_SECRET_KEY: props.stripeSecretKey ?? "",
          ...(props.primaryDatabaseSecretArn
            ? {
                PRIMARY_DATABASE_SECRET_ARN: props.primaryDatabaseSecretArn,
              }
            : {}),
        },
      },
    );

    this.billingCreateSubscriptionFn = new nodejs.NodejsFunction(
      this,
      "BillingCreateSubscription",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "..",
          "lambda_functions",
          "billing-create-subscription",
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
          STRIPE_SECRET_KEY: props.stripeSecretKey ?? "",
          ...(props.primaryDatabaseSecretArn
            ? {
                PRIMARY_DATABASE_SECRET_ARN: props.primaryDatabaseSecretArn,
              }
            : {}),
        },
      },
    );

    this.stripeWebhookFn = new nodejs.NodejsFunction(this, "StripeWebhook", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(
        __dirname,
        "..",
        "lambda_functions",
        "stripe-webhook",
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
        STRIPE_SECRET_KEY: props.stripeSecretKey ?? "",
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "",
        ...(props.primaryDatabaseSecretArn
          ? {
              PRIMARY_DATABASE_SECRET_ARN: props.primaryDatabaseSecretArn,
            }
          : {}),
      },
    });

    if (props.primaryDatabaseSecretArn) {
      const billingDatabaseCredentialsSecret =
        secretsmanager.Secret.fromSecretCompleteArn(
          this,
          "SynchronousBillingDatabaseCredentialsSecret",
          props.primaryDatabaseSecretArn,
        );

      billingDatabaseCredentialsSecret.grantRead(
        this.billingCreateSetupIntentFn,
      );
      billingDatabaseCredentialsSecret.grantRead(
        this.billingCreateSubscriptionFn,
      );
      billingDatabaseCredentialsSecret.grantRead(this.stripeWebhookFn);
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

    new cdk.CfnOutput(this, "VerifySessionLambdaArn", {
      value: this.verifySessionFn.functionArn,
      exportName: "SynchronousLambdaFunctionsStack:VerifySessionFnLambdaArn",
    });

    new cdk.CfnOutput(this, "RefreshLambdaArn", {
      value: this.refreshFn.functionArn,
      exportName: "SynchronousLambdaFunctionsStack:RefreshFnLambdaArn",
    });

    new cdk.CfnOutput(this, "GetUserLambdaArn", {
      value: this.getUserFn.functionArn,
      exportName: "SynchronousLambdaFunctionsStack:GetUserFnLambdaArn",
    });

    new cdk.CfnOutput(this, "S3AccessBrokerLambdaArn", {
      value: this.s3AccessBrokerFn.functionArn,
      exportName: "SynchronousLambdaFunctionsStack:S3AccessBrokerFnLambdaArn",
    });
  }
}
