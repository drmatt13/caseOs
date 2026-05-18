import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class FrontendWebsiteS3Stack extends cdk.Stack {
  public readonly frontendWebsiteBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.frontendWebsiteBucket = new s3.Bucket(
      this,
      "FrontendWebsiteBucket",
      {
        bucketName: `caseos-frontend-website-${this.account}-${this.region}`,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        enforceSSL: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      },
    );

    new cdk.CfnOutput(this, "FrontendWebsiteBucketName", {
      value: this.frontendWebsiteBucket.bucketName,
      exportName: "FrontendWebsiteS3Stack:FrontendWebsiteBucketName",
    });

    new cdk.CfnOutput(this, "FrontendWebsiteBucketArn", {
      value: this.frontendWebsiteBucket.bucketArn,
      exportName: "FrontendWebsiteS3Stack:FrontendWebsiteBucketArn",
    });
  }
}
