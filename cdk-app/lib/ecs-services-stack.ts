import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as path from "path";

export interface EcsServicesStackProps extends cdk.StackProps {
  userPoolId: string;
  userPoolClientId: string;
  userPoolDomainUrl?: string;
}

export class EcsServicesStack extends cdk.Stack {
  public readonly langgraphServiceUrl: string;
  // public readonly <ecsServiceURL>: string;

  constructor(scope: Construct, id: string, props: EcsServicesStackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, "DefaultVpc", { isDefault: true });

    const cluster = new ecs.Cluster(this, "EcsCluster", {
      vpc,
    });

    const langgraphEnvironment: Record<string, string> = {
      AWS_REGION: cdk.Stack.of(this).region,
      PORT: "5000",
      USER_POOL_ID: props.userPoolId,
      USER_POOL_CLIENT_ID: props.userPoolClientId,
    };

    if (props.userPoolDomainUrl) {
      langgraphEnvironment.COGNITO_DOMAIN_URL = props.userPoolDomainUrl;
    }

    const langgraphService =
      new ecsPatterns.ApplicationLoadBalancedFargateService(
        this,
        "LanggraphService",
        {
          cluster,
          cpu: 256,
          memoryLimitMiB: 512,
          desiredCount: 1,
          publicLoadBalancer: true,
          assignPublicIp: true,
          taskImageOptions: {
            image: ecs.ContainerImage.fromAsset(
              path.join(__dirname, "..", "ecs_containers", "langgraph-service"),
              {
                file: "dockerfile",
              },
            ),
            containerPort: 5000,
            environment: langgraphEnvironment,
          },
        },
      );

    this.langgraphServiceUrl = `http://${langgraphService.loadBalancer.loadBalancerDnsName}`;
    // this.<ecsServiceUrl> = `http://${<ecsService>.loadBalancer.loadBalancerDnsName}`;

    new cdk.CfnOutput(this, "LanggraphServiceUrl", {
      value: this.langgraphServiceUrl,
    });
  }
}
