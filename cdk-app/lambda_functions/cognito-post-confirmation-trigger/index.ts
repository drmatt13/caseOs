import { Context, PostConfirmationTriggerEvent } from "aws-lambda";
import {
  captureEventDrivenInvocation,
  getDatabaseUrl,
} from "@repo/shared-lambda-utils";
import { getPrismaClient } from "@repo/database";

export const lambdaHandler = async (
  event: PostConfirmationTriggerEvent,
  context: Context,
): Promise<PostConfirmationTriggerEvent> => {
  // Capture ASYNC invocation and run it through the local dev server
  if (process.env.USE_LOCAL_IMPLEMENTATIONS === "true") {
    if (
      !process.env.DEV_LAMBDA_REPLAY_BUCKET_NAME ||
      !process.env.DEV_LAMBDA_REPLAY_QUEUE_URL
    ) {
      const message = `Missing required replay configuration. Set DEV_LAMBDA_REPLAY_BUCKET_NAME and DEV_LAMBDA_REPLAY_QUEUE_URL before invoking the Cognito post-confirmation trigger with USE_LOCAL_IMPLEMENTATIONS=true.`;
      console.error(message);
      throw new Error(message);
    }

    await captureEventDrivenInvocation(
      event,
      context,
      "CognitoPostConfirmationTrigger",
      {
        replayBucketName: process.env.DEV_LAMBDA_REPLAY_BUCKET_NAME,
        replayQueueUrl: process.env.DEV_LAMBDA_REPLAY_QUEUE_URL,
      },
    );
    return event;
  }

  // Gets production or local database URL, with support for Secrets Manager in production
  const databaseUrl = await getDatabaseUrl({
    primaryDatabaseSecretArn: process.env.PRIMARY_DATABASE_SECRET_ARN,
    primaryDatabaseUrl: process.env.PRIMARY_DATABASE_URL,
    primaryDatabaseSslmode: process.env.PRIMARY_DATABASE_SSLMODE,
  });

  // Initialize Prisma client with the database URL
  const prisma = getPrismaClient(databaseUrl);

  // Create a new user in the database based on the Cognito user attributes
  const { sub, email, given_name, family_name } = event.request.userAttributes;
  const displayName = [given_name, family_name].filter(Boolean).join(" ");

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ cognitoSub: sub }, { email }],
    },
  });

  if (existingUser) {
    if (existingUser.cognitoSub !== sub) {
      throw new Error(
        `A user already exists for email ${email} with a different Cognito sub.`,
      );
    }

    console.log(
      "User already exists in database for Cognito sub; skipping post-confirmation creation:",
      sub,
    );
    return event;
  }

  // Create the user in the database, using the Cognito sub as a unique identifier
  await prisma.user.create({
    data: {
      cognitoSub: sub,
      email,
      billingEmail: email,
      firstName: given_name,
      lastName: family_name,
      accountTier: "FREE",
      accountStatus: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
      displayName,
    },
  });

  // CREATE RETRY LOGIC HERE LATER IF DESIRED - COGNITO TRIGGERS HAVE A BUILT-IN RETRY MECHANISM, BUT IT MAY NOT BE SUFFICIENT FOR ALL FAILURE SCENARIOS

  console.log("User created with Cognito sub:", sub);
  return event;
};
