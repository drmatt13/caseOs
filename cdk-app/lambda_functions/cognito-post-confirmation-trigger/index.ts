import { Context, PostConfirmationTriggerEvent } from "aws-lambda";
import { captureEventDrivenInvocation } from "@repo/event-replay";
import { prisma } from "@repo/database/src/index";

export const lambdaHandler = async (
  event: PostConfirmationTriggerEvent,
  context: Context,
): Promise<PostConfirmationTriggerEvent> => {
  // Optionally capture this invocation and run it through the local dev server
  if (process.env.USE_LOCAL_IMPLEMENTATIONS === "true") {
    await captureEventDrivenInvocation(
      event,
      context,
      "CognitoPostConfirmationTrigger",
    );
    return event;
  }

  // Create user in database after confirmation (cloud mode only)
  if (process.env.PRIMARY_DATABASE_URL) {
    const { sub, email, given_name, family_name } =
      event.request.userAttributes;

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
  }

  return event;
};
