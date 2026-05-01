import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import { GetFederationTokenCommand, STSClient } from "@aws-sdk/client-sts";
import cookie from "cookie";
import { createRemoteJWKSet, jwtVerify } from "jose";

// Get required environment variables and throw an error if any are missing
const {
  AWS_REGION,
  USER_POOL_ID,
  USER_POOL_CLIENT_ID,
  CASEOS_STORAGE_BUCKET_ARN,
} = process.env;

if (
  !AWS_REGION ||
  !USER_POOL_ID ||
  !USER_POOL_CLIENT_ID ||
  !CASEOS_STORAGE_BUCKET_ARN
) {
  throw new Error("Missing S3 access broker environment variables");
}

const issuer = `https://cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID}`;
const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
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
    // Get the ID token from the cookies
    const idToken = cookie.parse(event.headers.cookie ?? "").idToken;

    // If no token is found, return an unauthorized response
    if (!idToken) {
      return {
        statusCode: 401,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Unauthorized" }),
      };
    }

    // Verify the ID token and extract the payload
    const { payload } = await jwtVerify(idToken, jwks, {
      issuer,
      audience: USER_POOL_CLIENT_ID,
    });

    // If the token is valid but doesn't contain the expected claims, return an unauthorized response
    if (payload.token_use !== "id" || !payload.sub) {
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

    const profilePictureKey = `profile-pictures/${payload.sub}`;
    const bucketName = getBucketNameFromArn(CASEOS_STORAGE_BUCKET_ARN);

    const federationToken = await stsClient.send(
      new GetFederationTokenCommand({
        Name: `caseos-${String(payload.sub).slice(0, 24)}`,
        DurationSeconds: 900,
        Policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: "s3:PutObject",
              Resource: `${CASEOS_STORAGE_BUCKET_ARN}/profile-pictures/${payload.sub}.jpg`,
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
