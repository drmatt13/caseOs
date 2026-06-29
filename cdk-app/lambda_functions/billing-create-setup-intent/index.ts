import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import Stripe from "stripe";
import {
  getDatabaseUrl,
  jsonResponse,
  requireAuthenticatedSub,
} from "@repo/shared-lambda-utils";
import { getPrismaClient } from "@repo/database";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  try {
    // Validate the Cognito session and expose the Cognito subject.
    const cognitoSub = await requireAuthenticatedSub(event);

    // Return 401 when the request has no valid session.
    if (!cognitoSub) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return jsonResponse(500, {
        error: "STRIPE_SECRET_KEY is not configured",
      });
    }

    // Resolve the production or local database URL.
    const databaseUrl = await getDatabaseUrl({
      primaryDatabaseSecretArn: process.env.PRIMARY_DATABASE_SECRET_ARN,
      primaryDatabaseUrl: process.env.PRIMARY_DATABASE_URL,
      primaryDatabaseSslmode: process.env.PRIMARY_DATABASE_SSLMODE,
    });

    // Initialize Prisma with the resolved database URL.
    const prisma = getPrismaClient(databaseUrl);
    // Fetch the user by Cognito subject.
    const user = await prisma.user.findUnique({
      where: { cognitoSub },
    });

    // Return 404 when the authenticated user has no database record.
    if (!user) {
      return jsonResponse(404, { error: "User not found" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    let stripeCustomerId = user.stripeCustomerId;

    // Create and persist a Stripe customer when the user does not have one.
    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create(
        {
          email: user.billingEmail ?? user.email,
          name:
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
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

    // Create a SetupIntent for future off-session subscription payments.
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

    // Return the SetupIntent details needed by the client.
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
