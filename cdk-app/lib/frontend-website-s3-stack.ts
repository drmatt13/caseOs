import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export interface FrontendWebsiteS3StackProps extends cdk.StackProps {
  enableCloudFront?: boolean;
  prodDomainName?: string;
  prodCloudFrontCertificateArn?: string;
}

export class FrontendWebsiteS3Stack extends cdk.Stack {
  public readonly frontendWebsiteBucket: s3.Bucket;
  public readonly frontendDistribution?: cloudfront.CfnDistribution;
  public readonly cloudFrontUrl?: string;

  constructor(scope: Construct, id: string, props?: FrontendWebsiteS3StackProps) {
    super(scope, id, props);

    this.frontendWebsiteBucket = new s3.Bucket(
      this,
      "FrontendWebsiteBucket",
      {
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        enforceSSL: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      },
    );

    if (props?.enableCloudFront) {
      if (props.prodDomainName && !props.prodCloudFrontCertificateArn) {
        throw new Error(
          "prodCloudFrontCertificateArn is required when prodDomainName is configured.",
        );
      }

      const originAccessControl = new cloudfront.CfnOriginAccessControl(
        this,
        "FrontendOriginAccessControl",
        {
          originAccessControlConfig: {
            name: `${this.stackName}-frontend-website-oac`,
            description: `OAC for the ${this.stackName} frontend website bucket.`,
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
            ...(props.prodDomainName
              ? {
                  aliases: [props.prodDomainName],
                  viewerCertificate: {
                    acmCertificateArn: props.prodCloudFrontCertificateArn,
                    minimumProtocolVersion: "TLSv1.2_2021",
                    sslSupportMethod: "sni-only",
                  },
                }
              : {}),
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

      this.cloudFrontUrl = `https://${this.frontendDistribution.attrDomainName}`;

      new cdk.CfnOutput(this, "CloudFrontUrl", {
        value: this.cloudFrontUrl,
        exportName: `${this.stackName}:CloudFrontUrl`,
      });

      new cdk.CfnOutput(this, "CloudFrontDomainName", {
        value: this.frontendDistribution.attrDomainName,
        exportName: `${this.stackName}:CloudFrontDomainName`,
      });

      new cdk.CfnOutput(this, "CloudFrontId", {
        value: this.frontendDistribution.ref,
        exportName: `${this.stackName}:CloudFrontId`,
      });
    }

    new cdk.CfnOutput(this, "FrontendWebsiteBucketName", {
      value: this.frontendWebsiteBucket.bucketName,
      exportName: `${this.stackName}:FrontendWebsiteBucketName`,
    });

    new cdk.CfnOutput(this, "FrontendWebsiteBucketArn", {
      value: this.frontendWebsiteBucket.bucketArn,
      exportName: `${this.stackName}:FrontendWebsiteBucketArn`,
    });
  }
}
