import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import cookie from "cookie";
import { createRemoteJWKSet, jwtVerify } from "jose";
import Stripe from "stripe";
import { getDatabaseUrl } from "@repo/shared-lambda-utils";
import { getPrismaClient } from "@repo/database";

const { AWS_REGION, USER_POOL_ID, USER_POOL_CLIENT_ID } = process.env;

if (!AWS_REGION || !USER_POOL_ID || !USER_POOL_CLIENT_ID) {
  throw new Error("Missing Cognito environment variables");
}

const issuer = `https://cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID}`;
const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

const jsonResponse = (statusCode: number, body: unknown): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify(body),
});

async function requireAuthenticatedSub(
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
) {
  const idToken = cookie.parse(event.headers.cookie ?? "").idToken;

  if (!idToken) return null;

  const { payload } = await jwtVerify(idToken, jwks, {
    issuer,
    audience: USER_POOL_CLIENT_ID,
  });

  if (payload.token_use !== "id" || !payload.sub) return null;

  return payload.sub;
}

export const lambdaHandler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  try {
    const cognitoSub = await requireAuthenticatedSub(event);

    if (!cognitoSub) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return jsonResponse(500, { error: "STRIPE_SECRET_KEY is not configured" });
    }

    const databaseUrl = await getDatabaseUrl({
      primaryDatabaseSecretArn: process.env.PRIMARY_DATABASE_SECRET_ARN,
      primaryDatabaseUrl: process.env.PRIMARY_DATABASE_URL,
      primaryDatabaseSslmode: process.env.PRIMARY_DATABASE_SSLMODE,
    });

    const prisma = getPrismaClient(databaseUrl);
    const user = await prisma.user.findUnique({
      where: { cognitoSub },
    });

    if (!user) {
      return jsonResponse(404, { error: "User not found" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create(
        {
          email: user.billingEmail ?? user.email,
          name:
            user.displayName ??
            [user.firstName, user.lastName].filter(Boolean).join(" ") ??
            undefined,
          metadata: {
            cognitoSub,
            userId: user.id,
          },
        },
        {
          idempotencyKey: `stripe-customer-user-${user.id}`,
        },
      );

      stripeCustomerId = stripeCustomer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          stripeCustomerId,
        },
      });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      usage: "off_session",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: user.id,
        cognitoSub,
      },
    });

    return jsonResponse(200, {
      success: true,
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    });
  } catch (error) {
    console.error("Error creating Stripe SetupIntent:", error);
    return jsonResponse(500, { error: "Could not initialize payment details" });
  }
};
