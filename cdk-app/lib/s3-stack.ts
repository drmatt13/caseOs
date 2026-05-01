import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export interface S3StackProps extends cdk.StackProps {
  retainStatefulResouces?: boolean;
}

export class S3Stack extends cdk.Stack {
  public readonly caseOSBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: S3StackProps) {
    super(scope, id, props);

    const retainStatefulResouces = props?.retainStatefulResouces ?? false;

    this.caseOSBucket = new s3.Bucket(this, "CaseOSBucket", {
      bucketName: `caseos-${this.account}-${this.region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: retainStatefulResouces
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !retainStatefulResouces,
    });

    new cdk.CfnOutput(this, "CaseOSBucketName", {
      value: this.caseOSBucket.bucketName,
      exportName: "S3Stack:CaseOSBucketName",
    });

    new cdk.CfnOutput(this, "CaseOSBucketArn", {
      value: this.caseOSBucket.bucketArn,
      exportName: "S3Stack:CaseOSBucketArn",
    });
  }
}
