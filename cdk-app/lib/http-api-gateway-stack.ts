import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as authorizers from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { IFunction } from "aws-cdk-lib/aws-lambda";
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
  s3AccessBrokerFn: IFunction;

  // stripe functions
  billingListProductsFn: IFunction;
  billingCreateSetupIntentFn: IFunction;
  billingCreateSubscriptionFn: IFunction;
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

    const api = new apigwv2.HttpApi(this, "HttpApi", {
      apiName: "LocalDevKitHttpApi",
      createDefaultStage: true,
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
        integration: new integrations.HttpLambdaIntegration(id, handler),
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
        integration: new integrations.HttpLambdaIntegration(id, handler),
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
      "/sign-in",
      [apigwv2.HttpMethod.ANY],
      props.signInFn,
    );

    addPublicRoute(
      "SignOutIntegration",
      "/sign-out",
      [apigwv2.HttpMethod.ANY],
      props.signOutFn,
    );

    addPublicRoute(
      "OAuthCallbackIntegration",
      "/oauth/callback",
      [apigwv2.HttpMethod.ANY],
      props.oauthCallbackFn,
    );

    addPublicRoute(
      "RefreshIntegration",
      "/refresh",
      [apigwv2.HttpMethod.ANY],
      props.refreshFn,
    );

    /*********************************
     *     Authenticated Routes      *
     *********************************/
    addAuthenticatedRoute(
      "VerifySessionIntegration",
      "/verify-session",
      authenticatedReadWriteMethods,
      props.verifySessionFn,
    );

    addAuthenticatedRoute(
      "GetUserIntegration",
      "/get-user",
      authenticatedReadWriteMethods,
      props.getUserFn,
    );

    addAuthenticatedRoute(
      "GraphQLApiIntegration",
      "/graphql",
      authenticatedReadWriteMethods,
      props.graphqlApiFn,
    );

    addAuthenticatedRoute(
      "S3AccessBrokerIntegration",
      "/s3-access-broker",
      authenticatedReadWriteMethods,
      props.s3AccessBrokerFn,
    );

    // -- Stripe Routes --
    addAuthenticatedRoute(
      "BillingListProductsIntegration",
      "/billing/list-products",
      authenticatedReadWriteMethods,
      props.billingListProductsFn,
    );

    addAuthenticatedRoute(
      "BillingCreateSetupIntentIntegration",
      "/billing/create-setup-intent",
      authenticatedReadWriteMethods,
      props.billingCreateSetupIntentFn,
    );

    addAuthenticatedRoute(
      "BillingCreateSubscriptionIntegration",
      "/billing/create-subscription",
      authenticatedReadWriteMethods,
      props.billingCreateSubscriptionFn,
    );

    /*********************************
     *        Webhook Routes         *
     *********************************/
    addPublicRoute(
      "StripeWebhookIntegration",
      "/stripe/webhook",
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
