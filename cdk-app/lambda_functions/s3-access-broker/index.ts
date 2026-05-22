import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import {
  AssumeRoleCommand,
  GetFederationTokenCommand,
  STSClient,
} from "@aws-sdk/client-sts";
import {
  jsonResponse,
  requireAuthenticatedSub,
} from "@repo/shared-lambda-utils";

// Validate required environment configuration at startup.
const { AWS_REGION, APPLICATION_DATA_BUCKET_ARN, PROFILE_PICTURE_UPLOAD_ROLE_ARN } =
  process.env;

if (!AWS_REGION || !APPLICATION_DATA_BUCKET_ARN) {
  throw new Error("Missing S3 access broker environment variables");
}

const stsClient = new STSClient({ region: AWS_REGION });

const getBucketNameFromArn = (bucketArn: string): string => {
  const arnParts = bucketArn.split(":::");
  const bucketName = arnParts[1];

  if (!bucketName) {
    throw new Error("Invalid APPLICATION_DATA_BUCKET_ARN");
  }

  return bucketName;
};

const getProfilePicturePolicy = (profilePictureKey: string): string =>
  JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: "s3:PutObject",
        Resource: `${APPLICATION_DATA_BUCKET_ARN}/${profilePictureKey}`,
      },
    ],
  });

const getSessionName = (cognitoSub: string): string =>
  `caseos-${cognitoSub.slice(0, 24)}`;

async function getScopedUploadCredentials(
  cognitoSub: string,
  profilePictureKey: string,
) {
  const sessionName = getSessionName(cognitoSub);
  const policy = getProfilePicturePolicy(profilePictureKey);

  if (PROFILE_PICTURE_UPLOAD_ROLE_ARN) {
    return (
      await stsClient.send(
        new AssumeRoleCommand({
          RoleArn: PROFILE_PICTURE_UPLOAD_ROLE_ARN,
          RoleSessionName: sessionName,
          DurationSeconds: 900,
          Policy: policy,
        }),
      )
    ).Credentials;
  }

  return (
    await stsClient.send(
      new GetFederationTokenCommand({
        Name: sessionName,
        DurationSeconds: 900,
        Policy: policy,
      }),
    )
  ).Credentials;
}

export const lambdaHandler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  // Validate the Cognito session and expose the Cognito subject.
  const cognitoSub = await requireAuthenticatedSub(event);

  // Return 401 when the request has no valid session.
  if (!cognitoSub) {
    return jsonResponse(401, { message: "Unauthorized" });
  }

  try {
    // Build the user's profile-picture object key and public URL.
    const profilePictureKey = `profile-pictures/${cognitoSub}.jpg`;
    const bucketName = getBucketNameFromArn(APPLICATION_DATA_BUCKET_ARN);
    const profilePictureUrl = `https://${bucketName}.s3.${AWS_REGION}.amazonaws.com/${profilePictureKey}`;

    // Issue short-lived credentials scoped to the user's profile picture.
    const credentials = await getScopedUploadCredentials(
      cognitoSub,
      profilePictureKey,
    );

    // Validate the STS response contains the expected credentials.
    if (
      !credentials?.AccessKeyId ||
      !credentials.SecretAccessKey ||
      !credentials.SessionToken ||
      !credentials.Expiration
    ) {
      throw new Error("STS did not return complete session credentials");
    }

    // Return temporary AWS credentials and upload target details.
    return jsonResponse(200, {
      aws: {
        accessKeyId: credentials.AccessKeyId,
        secretAccessKey: credentials.SecretAccessKey,
        sessionToken: credentials.SessionToken,
        expiration: credentials.Expiration.toISOString(),
      },
      bucketArn: APPLICATION_DATA_BUCKET_ARN,
      bucketName,
      profilePictureKey,
      profilePictureUrl,
    });
  } catch (error) {
    console.error("Error brokering S3 access:", error);

    return jsonResponse(500, { message: "Could not broker S3 access" });
  }
};
