import { APIGatewayAuthorizerResult } from "aws-lambda";
import { createRemoteJWKSet, jwtVerify } from "jose";

const { AWS_REGION, USER_POOL_ID, USER_POOL_CLIENT_ID } = process.env;

if (!AWS_REGION || !USER_POOL_ID || !USER_POOL_CLIENT_ID) {
  throw new Error("Missing Cognito environment variables");
}

const issuer = `https://cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID}`;

const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

interface WebSocketAuthorizerEvent {
  type: string;
  methodArn: string;
  requestContext: {
    connectionId: string;
    apiId: string;
    stage: string;
  };
  queryStringParameters?: Record<string, string> | null;
  headers?: Record<string, string> | null;
}

export const lambdaHandler = async (
  event: WebSocketAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
  // Extract the token from query parameters
  const token = event.queryStringParameters?.token ?? null;

  // If no token is provided, deny access
  if (!token) {
    console.log("No token found in query parameters - denying connection");
    return {
      principalId: "anonymous",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Deny",
            Resource: event.methodArn,
          },
        ],
      },
    };
  }

  try {
    // Verify the token and extract the payload
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      audience: USER_POOL_CLIENT_ID,
    });

    // If the token is valid but doesn't contain the expected claims, deny access
    if (payload.token_use !== "id" || !payload.sub) {
      return {
        principalId: "anonymous",
        policyDocument: {
          Version: "2012-10-17",
          Statement: [
            {
              Action: "execute-api:Invoke",
              Effect: "Deny",
              Resource: event.methodArn,
            },
          ],
        },
      };
    }

    // If the token is valid and contains the expected claims, allow access
    return {
      principalId: payload.sub,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Allow",
            Resource: event.methodArn,
          },
        ],
      },
    };

    // If any errors occur during token verification, deny access
  } catch (error) {
    console.error("Error verifying WebSocket authorizer token:", error);
    return {
      principalId: "anonymous",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Deny",
            Resource: event.methodArn,
          },
        ],
      },
    };
  }
};
