import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as authorizers from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { HttpUserPoolAuthorizerConfig } from "./synchronous-lambda-functions-stack";

export interface HttpApiGatewayStackProps extends cdk.StackProps {
  signInFn: IFunction;
  signOutFn: IFunction;
  oauthCallbackFn: IFunction;
  verifyUserFn: IFunction;
  refreshFn: IFunction;
  getUserFn: IFunction;
  httpUserPoolAuthorizerConfig: HttpUserPoolAuthorizerConfig;
  frontendUrl: string;
  useLocalImplementations: boolean;
  langgraphServiceUrl?: string;
}

export class HttpApiGatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: HttpApiGatewayStackProps) {
    super(scope, id, props);

    const api = new apigwv2.HttpApi(this, "HttpApi", {
      apiName: "LocalDevKitHttpApi",
      createDefaultStage: true,
      corsPreflight: {
        allowOrigins: [props.frontendUrl],
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
        identitySource: ["$request.cookie.accessToken"],
        userPoolClients: [userPoolClient],
      },
    );

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

    // Public Routes
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

    // Authenticated Routes
    addAuthenticatedRoute(
      "VerifyUserIntegration",
      "/verify-user",
      [apigwv2.HttpMethod.ANY],
      props.verifyUserFn,
    );

    addAuthenticatedRoute(
      "GetUserIntegration",
      "/get-user",
      [apigwv2.HttpMethod.ANY],
      props.getUserFn,
    );

    if (!props.useLocalImplementations && props.langgraphServiceUrl) {
      api.addRoutes({
        path: "/langgraph/{proxy+}",
        methods: [apigwv2.HttpMethod.ANY],
        integration: new integrations.HttpUrlIntegration(
          "LanggraphServiceUrlIntegration",
          props.langgraphServiceUrl,
        ),
      });
    }

    new cdk.CfnOutput(this, "HttpApiUrl", {
      value: api.apiEndpoint,
      exportName: "HttpApiGatewayStack:HttpApiUrl",
    });
  }
}
