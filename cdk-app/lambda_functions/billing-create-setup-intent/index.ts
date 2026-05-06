import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import Stripe from "stripe";
import {
  getDatabaseUrl,
  requireAuthenticatedSub,
} from "@repo/shared-lambda-utils";
import { getPrismaClient } from "@repo/database";

const jsonResponse = (
  statusCode: number,
  body: unknown,
): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify(body),
});

export const lambdaHandler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  try {
    const cognitoSub = await requireAuthenticatedSub(event);

    if (!cognitoSub) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return jsonResponse(500, {
        error: "STRIPE_SECRET_KEY is not configured",
      });
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

    // If the user doesn't have a Stripe customer ID, create a new customer in Stripe and save the ID in the database
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
