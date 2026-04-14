import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { IFunction } from "aws-cdk-lib/aws-lambda";

export interface ApiStackProps extends cdk.StackProps {
  signIn: IFunction;
  verifyUser: IFunction;
  // testContainer1Url: string;
  // testContainer2Url: string;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const api = new apigwv2.HttpApi(this, "HttpApi", {
      apiName: "LocalDevKitHttpApi",
      createDefaultStage: true,
    });

    api.addRoutes({
      path: "/sign-in",
      methods: [apigwv2.HttpMethod.ANY],
      integration: new integrations.HttpLambdaIntegration(
        "SignInIntegration",
        props.signIn,
      ),
    });

    api.addRoutes({
      path: "/verify-user",
      methods: [apigwv2.HttpMethod.ANY],
      integration: new integrations.HttpLambdaIntegration(
        "VerifyUserIntegration",
        props.verifyUser,
      ),
    });

    // api.addRoutes({
    //   path: "/test-container-1",
    //   methods: [apigwv2.HttpMethod.ANY],
    //   integration: new integrations.HttpUrlIntegration(
    //     "TestContainer1Integration",
    //     props.testContainer1Url,
    //   ),
    // });

    // api.addRoutes({
    //   path: "/test-container-2",
    //   methods: [apigwv2.HttpMethod.ANY],
    //   integration: new integrations.HttpUrlIntegration(
    //     "TestContainer2Integration",
    //     props.testContainer2Url,
    //   ),
    // });

    new cdk.CfnOutput(this, "HttpApiUrl", {
      value: api.apiEndpoint,
    });
  }
}
