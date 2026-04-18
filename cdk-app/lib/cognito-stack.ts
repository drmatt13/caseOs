import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { AsynchronousLambdaFunctionsStack } from "./asynchronous-lambda-functions-stack";

export interface CognitoStackProps extends cdk.StackProps {
  googleClientId?: string;
  googleClientSecret?: cdk.SecretValue;
  callbackUrls?: string[];
  logoutUrls?: string[];
  useLocalImplementations?: boolean;
  skipEmailVerification?: boolean;
  asynchronousLambdaFunctionsStack?: AsynchronousLambdaFunctionsStack;
}

export class CognitoStack extends cdk.Stack {
  public readonly userPoolId: string;
  public readonly userPoolClientId: string;

  constructor(scope: Construct, id: string, props: CognitoStackProps) {
    super(scope, id, props);

    const useLocalImplementations = props.useLocalImplementations ?? true;
    const skipEmailVerification = props.skipEmailVerification ?? false;

    const callbackUrls = props.callbackUrls ?? [
      "http://localhost:3000/auth/callback",
    ];

    const logoutUrls = props.logoutUrls ?? ["http://localhost:3000/"];

    const domainPrefix = `localdevkit-${cdk.Stack.of(this)
      .account.slice(-8)
      .toLowerCase()}`;

    const userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "LocalDevKitUserPool",

      selfSignUpEnabled: true,
      signInCaseSensitive: false,

      signInAliases: {
        email: true,
      },

      autoVerify: {
        email: true,
      },

      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
      },

      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },

      email: cognito.UserPoolEmail.withCognito(),
      lambdaTriggers: {
        customMessage:
          props.asynchronousLambdaFunctionsStack?.cognitoCustomMessage,
        preSignUp: skipEmailVerification
          ? props.asynchronousLambdaFunctionsStack?.cognitoPreSignUpTrigger
          : undefined,
        postConfirmation:
          props.asynchronousLambdaFunctionsStack
            ?.cognitoPostConfirmationTrigger,
      },

      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      mfa: cognito.Mfa.OPTIONAL,

      deletionProtection: !useLocalImplementations,
      removalPolicy: useLocalImplementations
        ? cdk.RemovalPolicy.DESTROY
        : cdk.RemovalPolicy.RETAIN,
    });

    const domain = userPool.addDomain("UserPoolDomain", {
      cognitoDomain: {
        domainPrefix,
      },
    });

    let googleProvider: cognito.UserPoolIdentityProviderGoogle | undefined;

    if (props.googleClientId && props.googleClientSecret) {
      googleProvider = new cognito.UserPoolIdentityProviderGoogle(
        this,
        "Google",
        {
          userPool,
          clientId: props.googleClientId,
          clientSecretValue: props.googleClientSecret,
          scopes: ["openid", "email", "profile"],
          attributeMapping: {
            email: cognito.ProviderAttribute.GOOGLE_EMAIL,
            givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
            familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
            profilePicture: cognito.ProviderAttribute.GOOGLE_PICTURE,
          },
        },
      );
    }

    const supportedIdentityProviders = googleProvider
      ? [
          cognito.UserPoolClientIdentityProvider.COGNITO,
          cognito.UserPoolClientIdentityProvider.GOOGLE,
        ]
      : [cognito.UserPoolClientIdentityProvider.COGNITO];

    const userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool,
      generateSecret: false,
      supportedIdentityProviders,
      preventUserExistenceErrors: true,

      authFlows: {
        userSrp: true,
        userPassword: true,
        adminUserPassword: false,
        custom: false,
      },

      authSessionValidity: cdk.Duration.minutes(5),
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),

      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls,
        logoutUrls,
      },
    });

    if (googleProvider) {
      userPoolClient.node.addDependency(googleProvider);
    }

    this.userPoolId = userPool.userPoolId;
    this.userPoolClientId = userPoolClient.userPoolClientId;

    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
      exportName: "CaseOs:CognitoStack:UserPoolId",
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
      exportName: "CaseOs:CognitoStack:UserPoolClientId",
    });

    new cdk.CfnOutput(this, "UserPoolDomainUrl", {
      value: `https://${domain.domainName}.auth.${this.region}.amazoncognito.com`,
      exportName: "CaseOs:CognitoStack:UserPoolDomainUrl",
    });
  }
}
