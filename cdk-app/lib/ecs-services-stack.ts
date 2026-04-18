import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as path from "path";

export class EcsServicesStack extends cdk.Stack {
  public readonly testContainer1Url: string;
  public readonly testContainer2Url: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, "DefaultVpc", { isDefault: true });

    const cluster = new ecs.Cluster(this, "EcsCluster", {
      vpc,
    });

    const container1Service =
      new ecsPatterns.ApplicationLoadBalancedFargateService(
        this,
        "TestContainer1Service",
        {
          cluster,
          cpu: 256,
          memoryLimitMiB: 512,
          desiredCount: 1,
          publicLoadBalancer: true,
          assignPublicIp: true,
          taskImageOptions: {
            image: ecs.ContainerImage.fromAsset(
              path.join(__dirname, "..", "ecs_containers", "test-container-1"),
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

    // const container2Service =
    //   new ecsPatterns.ApplicationLoadBalancedFargateService(
    //     this,
    //     "TestContainer2Service",
    //     {
    //       cluster,
    //       cpu: 256,
    //       memoryLimitMiB: 512,
    //       desiredCount: 1,
    //       taskImageOptions: {
    //         image: ecs.ContainerImage.fromAsset(
    //           path.join(__dirname, "..", "ecs_containers", "test-container-2"),
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

    this.testContainer1Url = `http://${container1Service.loadBalancer.loadBalancerDnsName}`;
    // this.testContainer2Url = `http://${container2Service.loadBalancer.loadBalancerDnsName}`;

    new cdk.CfnOutput(this, "TestContainer1ServiceUrl", {
      value: this.testContainer1Url,
    });

    // new cdk.CfnOutput(this, "TestContainer2ServiceUrl", {
    //   value: this.testContainer2Url,
    // });
  }
}
