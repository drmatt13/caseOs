import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export interface ApplicationS3StackProps extends cdk.StackProps {
  frontendUrls?: string[];
  retainStatefulResouces?: boolean;
}

export class ApplicationS3Stack extends cdk.Stack {
  public readonly applicationDataBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: ApplicationS3StackProps) {
    super(scope, id, props);

    const retainStatefulResouces = props?.retainStatefulResouces ?? false;
    const frontendUrls = (props?.frontendUrls ?? ["http://localhost:3000"]).map(
      (url) => (cdk.Token.isUnresolved(url) ? url : url.replace(/\/+$/, "")),
    );

    this.applicationDataBucket = new s3.Bucket(this, "ApplicationDataBucket", {
      bucketName: `lawstruct-ai-application-data-${this.account}-${this.region}`,
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
          allowedOrigins: frontendUrls,
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

    this.applicationDataBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: "AllowPublicReadProfilePictures",
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        actions: ["s3:GetObject"],
        resources: [
          `${this.applicationDataBucket.bucketArn}/profile-pictures/*`,
        ],
      }),
    );

    new cdk.CfnOutput(this, "ApplicationDataBucketName", {
      value: this.applicationDataBucket.bucketName,
      exportName: "ApplicationS3Stack:ApplicationDataBucketName",
    });

    new cdk.CfnOutput(this, "ApplicationDataBucketArn", {
      value: this.applicationDataBucket.bucketArn,
      exportName: "ApplicationS3Stack:ApplicationDataBucketArn",
    });
  }
}
