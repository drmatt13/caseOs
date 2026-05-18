import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export interface CloudFrontStackProps extends cdk.StackProps {
  frontendWebsiteBucketArn: string;
  frontendWebsiteBucketName: string;
  frontendWebsiteBucketRegionalDomainName: string;
}

export class CloudFrontStack extends cdk.Stack {
  public readonly frontendDistribution: cloudfront.CfnDistribution;
  public readonly frontendWebsiteUrl: string;

  constructor(scope: Construct, id: string, props: CloudFrontStackProps) {
    super(scope, id, props);

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
              domainName: props.frontendWebsiteBucketRegionalDomainName,
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

    this.frontendWebsiteUrl = `https://${this.frontendDistribution.attrDomainName}`;

    new s3.CfnBucketPolicy(this, "FrontendWebsiteBucketPolicy", {
      bucket: props.frontendWebsiteBucketName,
      policyDocument: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: "AllowCloudFrontOacReadFrontendWebsite",
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal("cloudfront.amazonaws.com")],
            actions: ["s3:GetObject"],
            resources: [`${props.frontendWebsiteBucketArn}/*`],
            conditions: {
              StringEquals: {
                "AWS:SourceArn": `arn:aws:cloudfront::${this.account}:distribution/${this.frontendDistribution.ref}`,
              },
            },
          }),
        ],
      }).toJSON(),
    });

    new cdk.CfnOutput(this, "FrontendWebsiteUrl", {
      value: this.frontendWebsiteUrl,
      exportName: "CloudFrontStack:FrontendWebsiteUrl",
    });

    new cdk.CfnOutput(this, "FrontendDistributionDomainName", {
      value: this.frontendDistribution.attrDomainName,
      exportName: "CloudFrontStack:FrontendDistributionDomainName",
    });

    new cdk.CfnOutput(this, "FrontendDistributionId", {
      value: this.frontendDistribution.ref,
      exportName: "CloudFrontStack:FrontendDistributionId",
    });
  }
}
