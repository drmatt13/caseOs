import { Context, PostConfirmationTriggerEvent } from "aws-lambda";
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { captureEventDrivenInvocation } from "@repo/event-replay";
import { getPrismaClient } from "@repo/database";

const secretsManagerClient = new SecretsManagerClient({});

export const lambdaHandler = async (
  event: PostConfirmationTriggerEvent,
  context: Context,
): Promise<PostConfirmationTriggerEvent> => {
  // // Later optimize to make sure if current prisma connection can be reused before creating a new one

  // Optionally capture this invocation and run it through the local dev server
  if (process.env.USE_LOCAL_IMPLEMENTATIONS === "true") {
    await captureEventDrivenInvocation(
      event,
      context,
      "CognitoPostConfirmationTrigger",
    );
    return event;
  }

  let databaseUrl: string;

  // If this is running in the cloud then a database secret ARN must be provided
  if (process.env.PRIMARY_DATABASE_SECRET_ARN) {
    // get secret
    // ...
    // let databaseUrl = ...
  }

  // If this is running locally and environment variables for database connection are not set, throw an error since the function cannot operate without a database connection in local mode.
  if (
    !process.env.PRIMARY_DATABASE_SECRET_ARN &&
    !process.env.PRIMARY_DATABASE_URL
  ) {
    // return error
    throw new Error(
      "In local mode, PRIMARY_DATABASE_URL must be set to connect to the database. In cloud mode, PRIMARY_DATABASE_SECRET_ARN must be set to fetch database credentials from Secrets Manager.",
    );
  }

  // If this is running locally and the database URL is provided directly via environment variable, use that for Prisma connection.
  if (
    !process.env.PRIMARY_DATABASE_SECRET_ARN &&
    process.env.PRIMARY_DATABASE_URL
  ) {
    databaseUrl = process.env.PRIMARY_DATABASE_URL;
    console.log("Using PRIMARY_DATABASE_URL from environment for Prisma.", {
      databaseUrl: databaseUrl.replace(/:[^:@]+@/, ":****@"),
    });
  }

  const prisma = getPrismaClient(databaseUrl!);

  const { sub, email, given_name, family_name } = event.request.userAttributes;

  await prisma.user.create({
    data: {
      cognitoSub: sub,
      email,
      firstName: given_name,
      lastName: family_name,
      accountTier: "FREE",
      accountStatus: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
      displayName: `${given_name} ${family_name}`,
    },
  });

  console.log("User created in database with Cognito sub:", sub);
  return event;
};
