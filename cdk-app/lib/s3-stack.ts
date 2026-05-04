import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export interface S3StackProps extends cdk.StackProps {
  frontendUrl?: string;
  retainStatefulResouces?: boolean;
}

export class S3Stack extends cdk.Stack {
  public readonly caseOSBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: S3StackProps) {
    super(scope, id, props);

    const retainStatefulResouces = props?.retainStatefulResouces ?? false;
    const frontendUrl = (props?.frontendUrl ?? "http://localhost:3000").replace(
      /\/+$/,
      "",
    );

    this.caseOSBucket = new s3.Bucket(this, "CaseOSBucket", {
      bucketName: `caseos-${this.account}-${this.region}`,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: true,
        ignorePublicAcls: true,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      }),
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.HEAD,
            s3.HttpMethods.PUT,
          ],
          allowedOrigins: [frontendUrl],
          exposedHeaders: ["ETag"],
          maxAge: 3000,
        },
      ],
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: retainStatefulResouces
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !retainStatefulResouces,
    });

    this.caseOSBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: "AllowPublicReadProfilePictures",
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        actions: ["s3:GetObject"],
        resources: [`${this.caseOSBucket.bucketArn}/profile-pictures/*`],
      }),
    );

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
