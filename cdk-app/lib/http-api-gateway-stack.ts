import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { IFunction } from "aws-cdk-lib/aws-lambda";

export interface HttpApiGatewayStackProps extends cdk.StackProps {
  signInFn: IFunction;
  signOutFn: IFunction;
  verifyUserFn: IFunction;
  refreshFn: IFunction;
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

    api.addRoutes({
      path: "/sign-in",
      methods: [apigwv2.HttpMethod.ANY],
      integration: new integrations.HttpLambdaIntegration(
        "SignInIntegration",
        props.signInFn,
      ),
    });

    api.addRoutes({
      path: "/sign-out",
      methods: [apigwv2.HttpMethod.ANY],
      integration: new integrations.HttpLambdaIntegration(
        "SignOutIntegration",
        props.signOutFn,
      ),
    });

    api.addRoutes({
      path: "/verify-user",
      methods: [apigwv2.HttpMethod.ANY],
      integration: new integrations.HttpLambdaIntegration(
        "VerifyUserIntegration",
        props.verifyUserFn,
      ),
    });

    api.addRoutes({
      path: "/refresh",
      methods: [apigwv2.HttpMethod.ANY],
      integration: new integrations.HttpLambdaIntegration(
        "RefreshIntegration",
        props.refreshFn,
      ),
    });

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
