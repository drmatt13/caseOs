import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import { GetFederationTokenCommand, STSClient } from "@aws-sdk/client-sts";
import { requireAuthenticatedSub } from "@repo/shared-lambda-utils";

// Get required environment variables and throw an error if any are missing
const {
  AWS_REGION,
  CASEOS_STORAGE_BUCKET_ARN,
} = process.env;

if (
  !AWS_REGION ||
  !CASEOS_STORAGE_BUCKET_ARN
) {
  throw new Error("Missing S3 access broker environment variables");
}

const stsClient = new STSClient({ region: AWS_REGION });

const getBucketNameFromArn = (bucketArn: string): string => {
  const arnParts = bucketArn.split(":::");
  const bucketName = arnParts[1];

  if (!bucketName) {
    throw new Error("Invalid CASEOS_STORAGE_BUCKET_ARN");
  }

  return bucketName;
};

export const lambdaHandler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  try {
    const cognitoSub = await requireAuthenticatedSub(event);

    if (!cognitoSub) {
      return {
        statusCode: 401,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Unauthorized" }),
      };
    }

    // DO NOTHING WITH DATABASE YET, THAT FUNCTIONALTY COMES AFTER YOU CAN CREATE WORKSPACES AND ADD USERS TO THOSE WORKSPACES.
    //
    //
    //
    // CONTINUE BELOW

    const profilePictureKey = `profile-pictures/${cognitoSub}.jpg`;
    const bucketName = getBucketNameFromArn(CASEOS_STORAGE_BUCKET_ARN);
    const profilePictureUrl = `https://${bucketName}.s3.${AWS_REGION}.amazonaws.com/${profilePictureKey}`;

    const federationToken = await stsClient.send(
      new GetFederationTokenCommand({
        Name: `caseos-${cognitoSub.slice(0, 24)}`,
        DurationSeconds: 900,
        Policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: "s3:PutObject",
              Resource: `${CASEOS_STORAGE_BUCKET_ARN}/${profilePictureKey}`,
            },
          ],
        }),
      }),
    );

    const credentials = federationToken.Credentials;

    if (
      !credentials?.AccessKeyId ||
      !credentials.SecretAccessKey ||
      !credentials.SessionToken ||
      !credentials.Expiration
    ) {
      throw new Error("STS did not return complete session credentials");
    }

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        aws: {
          accessKeyId: credentials.AccessKeyId,
          secretAccessKey: credentials.SecretAccessKey,
          sessionToken: credentials.SessionToken,
          expiration: credentials.Expiration.toISOString(),
        },
        bucketArn: CASEOS_STORAGE_BUCKET_ARN,
        bucketName,
        profilePictureKey,
        profilePictureUrl,
      }),
    };
  } catch (error) {
    console.error("Error brokering S3 access:", error);

    return {
      statusCode: 401,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }
};
