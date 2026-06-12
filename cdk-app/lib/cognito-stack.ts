import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as iam from "aws-cdk-lib/aws-iam";
import { IFunction } from "aws-cdk-lib/aws-lambda";

export interface CognitoStackProps extends cdk.StackProps {
  cognitoDomainPrefix?: string;
  cognitoDomainName?: string;
  cognitoDomainCertificateArn?: string;
  googleClientId?: string;
  googleClientSecret?: cdk.SecretValue;
  callbackUrls?: string[];
  logoutUrls?: string[];
  useLocalDevStack?: boolean;
  retainStatefulResouces?: boolean;
  skipEmailVerification?: boolean;
  cognitoPreSignUpTriggerFn?: IFunction;
  cognitoCustomMessageFn?: IFunction;
  cognitoPostConfirmationTriggerFn?: IFunction;
}

export class CognitoStack extends cdk.Stack {
  public readonly userPoolId: string;
  public readonly userPoolClientId: string;
  public readonly userPoolDomainUrl: string;
  public readonly oauthProviderRedirectUri: string;

  constructor(scope: Construct, id: string, props: CognitoStackProps) {
    super(scope, id, props);

    const useLocalDevStack = props.useLocalDevStack ?? true;
    const retainStatefulResouces = props.retainStatefulResouces ?? false;
    const callbackUrls = props.callbackUrls ?? [
      "http://localhost:3000/auth/callback",
    ];

    const logoutUrls = props.logoutUrls ?? ["http://localhost:3000/"];

    const domainPrefix = props.cognitoDomainPrefix ?? "matts-aws-cdk-dev-kit";

    if (
      props.cognitoDomainName !== undefined &&
      props.cognitoDomainCertificateArn === undefined
    ) {
      throw new Error(
        "cognitoDomainCertificateArn is required when cognitoDomainName is configured.",
      );
    }

    if (
      props.cognitoDomainName === undefined &&
      props.cognitoDomainCertificateArn !== undefined
    ) {
      throw new Error(
        "cognitoDomainName is required when cognitoDomainCertificateArn is configured.",
      );
    }

    if (
      !props.cognitoDomainName &&
      !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(domainPrefix)
    ) {
      throw new Error(
        `cognitoDomainPrefix must be 1-63 lowercase letters, numbers, or hyphens, and cannot start or end with a hyphen. Received: ${domainPrefix}`,
      );
    }

    const userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: `${this.stackName}-UserPool`,

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
        customMessage: props.cognitoCustomMessageFn,
        preSignUp: props.cognitoPreSignUpTriggerFn,
        postConfirmation: props.cognitoPostConfirmationTriggerFn,
      },

      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      mfa: cognito.Mfa.OPTIONAL,

      deletionProtection: retainStatefulResouces,
      removalPolicy: retainStatefulResouces
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    const domain = userPool.addDomain(
      "UserPoolDomain",
      props.cognitoDomainName && props.cognitoDomainCertificateArn
        ? {
            customDomain: {
              domainName: props.cognitoDomainName,
              certificate: acm.Certificate.fromCertificateArn(
                this,
                "UserPoolDomainCertificate",
                props.cognitoDomainCertificateArn,
              ),
            },
          }
        : {
            cognitoDomain: {
              domainPrefix,
            },
          },
    );
    const userPoolDomainUrl = domain.baseUrl();

    props.cognitoPreSignUpTriggerFn?.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "cognito-idp:AdminLinkProviderForUser",
          "cognito-idp:ListUsers",
        ],
        resources: [
          cdk.Stack.of(this).formatArn({
            service: "cognito-idp",
            resource: "userpool",
            resourceName: "*",
          }),
        ],
      }),
    );

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
    this.userPoolDomainUrl = userPoolDomainUrl;
    this.oauthProviderRedirectUri = `${userPoolDomainUrl}/oauth2/idpresponse`;

    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
    });

    new cdk.CfnOutput(this, "UserPoolDomainUrl", {
      value: userPoolDomainUrl,
      exportName: `${this.stackName}:UserPoolDomainUrl`,
    });

    if (props.cognitoDomainName) {
      new cdk.CfnOutput(this, "UserPoolDomainCloudFrontEndpoint", {
        value: domain.cloudFrontEndpoint,
        exportName: `${this.stackName}:UserPoolDomainCloudFrontEndpoint`,
        description:
          "CloudFront endpoint to use as the DNS target for the Cognito custom domain.",
      });
    }

    new cdk.CfnOutput(this, "OAuthProviderRedirectUri", {
      value: this.oauthProviderRedirectUri,
      exportName: `${this.stackName}:OAuthProviderRedirectUri`,
      description:
        "Redirect URI to register with external OAuth providers such as Google.",
    });
  }
}
