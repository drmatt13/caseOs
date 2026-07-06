import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as authorizers from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import { API_ROUTE } from "@repo/api-contract";
import { HttpUserPoolAuthorizerConfig } from "./synchronous-lambda-functions-stack";

export interface HttpApiGatewayStackProps extends cdk.StackProps {
  // standard functions
  signInFn: IFunction;
  signOutFn: IFunction;
  oauthCallbackFn: IFunction;
  verifySessionFn: IFunction;
  refreshFn: IFunction;
  getUserFn: IFunction;
  graphqlApiFn: IFunction;
  profilePhotoUploadCredentialBrokerFn: IFunction;

  // stripe functions
  billingListProductsFn: IFunction;
  billingCreateSetupIntentFn: IFunction;
  billingCreateSubscriptionFn: IFunction;
  billingPlanChangePreviewFn: IFunction;
  stripeWebhookFn: IFunction;

  // ECS service URL for langgraph, if applicable. If not provided, the /langgraph/* route will not be added to the API Gateway, and the local dev stack will be used instead (if useLocalDevStack is true)
  langgraphServiceUrl?: string;

  // config
  httpUserPoolAuthorizerConfig: HttpUserPoolAuthorizerConfig;
  frontendUrls: string[];
  useLocalDevStack: boolean;
}

export class HttpApiGatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: HttpApiGatewayStackProps) {
    super(scope, id, props);

    const accessLogGroup = new logs.LogGroup(this, "HttpApiAccessLogs", {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const api = new apigwv2.HttpApi(this, "HttpApi", {
      apiName: "LawstructAiHttpApi",
      createDefaultStage: false,
      corsPreflight: {
        allowOrigins: props.frontendUrls,
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ["Content-Type", "Authorization"],
        allowCredentials: true,
      },
    });

    api.addStage("DefaultStage", {
      stageName: "$default",
      autoDeploy: true,
      accessLogSettings: {
        destination: new apigwv2.LogGroupLogDestination(accessLogGroup),
        format: apigw.AccessLogFormat.custom(
          JSON.stringify({
            requestId: "$context.requestId",
            routeKey: "$context.routeKey",
            status: "$context.status",
            responseLatency: "$context.responseLatency",
            integrationError: "$context.integrationErrorMessage",
            authorizerError: "$context.authorizer.error",
            sourceIp: "$context.identity.sourceIp",
          }),
        ),
      },
    });

    const userPool = cognito.UserPool.fromUserPoolId(
      this,
      "ImportedUserPool",
      props.httpUserPoolAuthorizerConfig.userPoolId,
    );

    const userPoolClient = cognito.UserPoolClient.fromUserPoolClientId(
      this,
      "ImportedUserPoolClient",
      props.httpUserPoolAuthorizerConfig.userPoolClientId,
    );

    const userPoolAuthorizer = new authorizers.HttpUserPoolAuthorizer(
      "HttpUserPoolAuthorizer",
      userPool,
      {
        identitySource: ["$request.header.Authorization"],
        userPoolClients: [userPoolClient],
      },
    );

    // Helper functions to add routes with less repetition
    const addPublicRoute = (
      id: string,
      path: string,
      methods: apigwv2.HttpMethod[],
      handler: IFunction,
    ) => {
      api.addRoutes({
        path,
        methods,
        integration: new integrations.HttpLambdaIntegration(id, handler, {
          payloadFormatVersion: apigwv2.PayloadFormatVersion.VERSION_2_0,
        }),
      });
    };

    const addAuthenticatedRoute = (
      id: string,
      path: string,
      methods: apigwv2.HttpMethod[],
      handler: IFunction,
    ) => {
      api.addRoutes({
        path,
        methods,
        integration: new integrations.HttpLambdaIntegration(id, handler, {
          payloadFormatVersion: apigwv2.PayloadFormatVersion.VERSION_2_0,
        }),
        authorizer: userPoolAuthorizer,
      });
    };

    const authenticatedReadWriteMethods = [
      apigwv2.HttpMethod.GET,
      apigwv2.HttpMethod.POST,
    ];

    /*********************************
     *         Public Routes         *
     *********************************/
    addPublicRoute(
      "SignInIntegration",
      API_ROUTE.signIn,
      [apigwv2.HttpMethod.ANY],
      props.signInFn,
    );

    addPublicRoute(
      "SignOutIntegration",
      API_ROUTE.signOut,
      [apigwv2.HttpMethod.ANY],
      props.signOutFn,
    );

    addPublicRoute(
      "OAuthCallbackIntegration",
      API_ROUTE.oauthCallback,
      [apigwv2.HttpMethod.ANY],
      props.oauthCallbackFn,
    );

    addPublicRoute(
      "RefreshIntegration",
      API_ROUTE.refresh,
      [apigwv2.HttpMethod.ANY],
      props.refreshFn,
    );

    /*********************************
     *     Authenticated Routes      *
     *********************************/
    addAuthenticatedRoute(
      "VerifySessionIntegration",
      API_ROUTE.verifySession,
      authenticatedReadWriteMethods,
      props.verifySessionFn,
    );

    addAuthenticatedRoute(
      "GetUserIntegration",
      API_ROUTE.getUser,
      authenticatedReadWriteMethods,
      props.getUserFn,
    );

    addAuthenticatedRoute(
      "GraphQLApiIntegration",
      API_ROUTE.graphql,
      authenticatedReadWriteMethods,
      props.graphqlApiFn,
    );

    addAuthenticatedRoute(
      "ProfilePhotoUploadCredentialBrokerIntegration",
      API_ROUTE.profilePhotoUploadCredentialBroker,
      authenticatedReadWriteMethods,
      props.profilePhotoUploadCredentialBrokerFn,
    );

    // -- Stripe Routes --
    addAuthenticatedRoute(
      "BillingListProductsIntegration",
      API_ROUTE.billingListProducts,
      authenticatedReadWriteMethods,
      props.billingListProductsFn,
    );

    addAuthenticatedRoute(
      "BillingCreateSetupIntentIntegration",
      API_ROUTE.billingCreateSetupIntent,
      authenticatedReadWriteMethods,
      props.billingCreateSetupIntentFn,
    );

    addAuthenticatedRoute(
      "BillingCreateSubscriptionIntegration",
      API_ROUTE.billingCreateSubscription,
      authenticatedReadWriteMethods,
      props.billingCreateSubscriptionFn,
    );

    addAuthenticatedRoute(
      "BillingPlanChangePreviewIntegration",
      API_ROUTE.billingPlanChangePreview,
      authenticatedReadWriteMethods,
      props.billingPlanChangePreviewFn,
    );

    /*********************************
     *        Webhook Routes         *
     *********************************/
    addPublicRoute(
      "StripeWebhookIntegration",
      API_ROUTE.stripeWebhook,
      [apigwv2.HttpMethod.ANY],
      props.stripeWebhookFn,
    );

    /*********************************
     *     ECS Service Routes        *
     *********************************/
    if (!props.useLocalDevStack && props.langgraphServiceUrl) {
      api.addRoutes({
        path: "/langgraph/{proxy+}",
        methods: [apigwv2.HttpMethod.ANY],
        integration: new integrations.HttpUrlIntegration(
          "LanggraphServiceUrlIntegration",
          props.langgraphServiceUrl,
        ),
      });
    }

    // Outputs
    new cdk.CfnOutput(this, "HttpApiUrl", {
      value: api.apiEndpoint,
      exportName: "HttpApiGatewayStack:HttpApiUrl",
    });
  }
}
