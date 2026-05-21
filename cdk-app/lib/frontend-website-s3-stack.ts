import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export interface FrontendWebsiteS3StackProps extends cdk.StackProps {
  enableCloudFront?: boolean;
}

export class FrontendWebsiteS3Stack extends cdk.Stack {
  public readonly frontendWebsiteBucket: s3.Bucket;
  public readonly frontendDistribution?: cloudfront.CfnDistribution;
  public readonly frontendWebsiteUrl?: string;

  constructor(scope: Construct, id: string, props?: FrontendWebsiteS3StackProps) {
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

    if (props?.enableCloudFront) {
      const originAccessControl = new cloudfront.CfnOriginAccessControl(
        this,
        "FrontendOriginAccessControl",
        {
          originAccessControlConfig: {
            name: "caseos-frontend-website-oac",
            description: "OAC for the CaseOS frontend website bucket.",
            originAccessControlOriginType: "s3",
            signingBehavior: "always",
            signingProtocol: "sigv4",
          },
        },
      );

      this.frontendDistribution = new cloudfront.CfnDistribution(
        this,
        "FrontendDistribution",
        {
          distributionConfig: {
            enabled: true,
            defaultRootObject: "index.html",
            origins: [
              {
                id: "FrontendWebsiteS3Origin",
                domainName:
                  this.frontendWebsiteBucket.bucketRegionalDomainName,
                originAccessControlId: originAccessControl.attrId,
                s3OriginConfig: {
                  originAccessIdentity: "",
                },
              },
            ],
            defaultCacheBehavior: {
              targetOriginId: "FrontendWebsiteS3Origin",
              viewerProtocolPolicy: "redirect-to-https",
              allowedMethods: ["GET", "HEAD", "OPTIONS"],
              cachedMethods: ["GET", "HEAD", "OPTIONS"],
              compress: true,
              forwardedValues: {
                queryString: false,
                cookies: {
                  forward: "none",
                },
              },
            },
            customErrorResponses: [
              {
                errorCode: 403,
                responseCode: 200,
                responsePagePath: "/index.html",
              },
              {
                errorCode: 404,
                responseCode: 200,
                responsePagePath: "/index.html",
              },
            ],
          },
        },
      );

      this.frontendWebsiteBucket.addToResourcePolicy(
        new iam.PolicyStatement({
          sid: "AllowCloudFrontOacReadFrontendWebsite",
          effect: iam.Effect.ALLOW,
          principals: [new iam.ServicePrincipal("cloudfront.amazonaws.com")],
          actions: ["s3:GetObject"],
          resources: [`${this.frontendWebsiteBucket.bucketArn}/*`],
          conditions: {
            StringEquals: {
              "AWS:SourceArn": `arn:aws:cloudfront::${this.account}:distribution/${this.frontendDistribution.ref}`,
            },
          },
        }),
      );

      this.frontendWebsiteUrl = `https://${this.frontendDistribution.attrDomainName}`;

      new cdk.CfnOutput(this, "FrontendWebsiteUrl", {
        value: this.frontendWebsiteUrl,
        exportName: "FrontendWebsiteS3Stack:FrontendWebsiteUrl",
      });

      new cdk.CfnOutput(this, "FrontendDistributionDomainName", {
        value: this.frontendDistribution.attrDomainName,
        exportName: "FrontendWebsiteS3Stack:FrontendDistributionDomainName",
      });

      new cdk.CfnOutput(this, "FrontendDistributionId", {
        value: this.frontendDistribution.ref,
        exportName: "FrontendWebsiteS3Stack:FrontendDistributionId",
      });
    }

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
