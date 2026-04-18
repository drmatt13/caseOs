import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as path from "path";

export class EcsServicesStack extends cdk.Stack {
  public readonly langgraphServiceUrl: string;
  // public readonly <ecsServiceURL>: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, "DefaultVpc", { isDefault: true });

    const cluster = new ecs.Cluster(this, "EcsCluster", {
      vpc,
    });

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
            environment: {
              PORT: "5000",
            },
          },
        },
      );

    // const <ecsService> =
    //   new ecsPatterns.ApplicationLoadBalancedFargateService(
    //     this,
    //     "<EcsService>",
    //     {
    //       cluster,
    //       cpu: 256,
    //       memoryLimitMiB: 512,
    //       desiredCount: 1,
    //       taskImageOptions: {
    //         image: ecs.ContainerImage.fromAsset(
    //           path.join(__dirname, "..", "ecs_containers", "<ecs-service>"),
    //           {
    //             file: "dockerfile",
    //           },
    //         ),
    //         containerPort: 5001,
    //         environment: {
    //           PORT: "5001",
    //         },
    //       },
    //       publicLoadBalancer: true,
    //     },
    //   );

    this.langgraphServiceUrl = `http://${langgraphService.loadBalancer.loadBalancerDnsName}`;
    // this.<ecsServiceUrl> = `http://${<ecsService>.loadBalancer.loadBalancerDnsName}`;

    new cdk.CfnOutput(this, "LanggraphServiceUrl", {
      value: this.langgraphServiceUrl,
    });

    // new cdk.CfnOutput(this, "<EcsService>Url", {
    //   value: this.<ecsServiceUrl>,
    // });
  }
}
