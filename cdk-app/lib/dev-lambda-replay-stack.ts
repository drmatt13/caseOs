import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";

export class DevLambdaReplayStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly queue: sqs.Queue;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.queue = new sqs.Queue(this, "DevLambdaReplayQueue", {
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    this.bucket = new s3.Bucket(this, "DevLambdaReplayBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    this.bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SqsDestination(this.queue),
    );

    new cdk.CfnOutput(this, "ReplayBucketName", {
      value: this.bucket.bucketName,
    });

    new cdk.CfnOutput(this, "ReplayQueueUrl", {
      value: this.queue.queueUrl,
    });

    new cdk.CfnOutput(this, "ReplayQueueArn", {
      value: this.queue.queueArn,
    });
  }
}
